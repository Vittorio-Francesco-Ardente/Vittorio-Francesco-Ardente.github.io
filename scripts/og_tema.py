#!/usr/bin/env python3
"""Aggiorna l'immagine di anteprima (og:image) in base alla stagione, con le stesse regole del tema automatico del sito."""
import re, sys, pathlib
from datetime import date, datetime
from zoneinfo import ZoneInfo

def pasqua(y):
    a=y%19; b=y//100; c=y%100; d=b//4; e=b%4; f=(b+8)//25; g=(b-f+1)//3
    h=(19*a+b-d-g+15)%30; i=c//4; k=c%4; l=(32+2*e+2*i-h-k)%7; m=(a+11*h+22*l)//451
    mese=(h+l-7*m+114)//31; giorno=(h+l-7*m+114)%31+1
    return date(y,mese,giorno)

def tema(oggi):
    t=oggi.month*100+oggi.day
    n=(oggi-pasqua(oggi.year)).days
    if -7<=n<=1: return 'pasqua'
    if 1201<=t<=1226: return 'natale'
    if t>=1227 or t<=106: return 'capodanno'
    if 1024<=t<=1031: return 'halloween'
    if 321<=t<=620: return 'primavera'
    if 621<=t<=922: return 'estate'
    if 923<=t<=1220: return 'autunno'
    return 'inverno'

if __name__=='__main__':
    nome=sys.argv[1] if len(sys.argv)>1 else tema(datetime.now(ZoneInfo('Europe/Rome')).date())
    radice=pathlib.Path(__file__).resolve().parent.parent
    assert (radice/f'og/og-{nome}.jpg').exists(), nome
    rx=re.compile(r'(https://[^"\']*?/)(?:og-vittorio\.jpg|og/og-[a-z]+\.jpg)(\?v=[a-z0-9]+)?')
    modificati=0
    for f in radice.rglob('*.html'):
        if '.git' in f.parts: continue
        s=f.read_text(encoding='utf8')
        n=rx.sub(lambda m: f'{m.group(1)}og/og-{nome}.jpg', s)
        if n!=s: f.write_text(n,encoding='utf8'); modificati+=1
    print(nome, modificati, 'pagine aggiornate')
