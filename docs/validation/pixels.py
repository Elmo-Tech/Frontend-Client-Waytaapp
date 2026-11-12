from pathlib import Path
import json,struct,zlib,hashlib

root=Path('/private/tmp/wayta-web-refactor/browser-evidence')
def read(p):
    raw=p.read_bytes();i=8;parts=[];header=None
    while i<len(raw):
        length=int.from_bytes(raw[i:i+4],'big');kind=raw[i+4:i+8];body=raw[i+8:i+8+length];i+=length+12
        if kind==b'IHDR':header=struct.unpack('>IIBBBBB',body)
        if kind==b'IDAT':parts.append(body)
    return raw,header,zlib.decompress(b''.join(parts))

def decode(header,data):
    width,height,depth,color,_,_,interlace=header
    assert depth==8 and color in (2,6) and interlace==0
    bpp=3 if color==2 else 4;stride=width*bpp
    previous=bytearray(stride);out=bytearray(stride*height)
    for y in range(height):
        start=y*(stride+1);kind=data[start];row=bytearray(data[start+1:start+1+stride])
        if kind==1:
            for x in range(bpp,stride):row[x]=(row[x]+row[x-bpp])&255
        elif kind==2:
            for x in range(stride):row[x]=(row[x]+previous[x])&255
        elif kind==3:
            for x in range(stride):row[x]=(row[x]+((row[x-bpp] if x>=bpp else 0)+previous[x])//2)&255
        elif kind==4:
            for x in range(stride):
                a=row[x-bpp] if x>=bpp else 0;b=previous[x];c=previous[x-bpp] if x>=bpp else 0;p=a+b-c;pa=abs(p-a);pb=abs(p-b);pc=abs(p-c)
                row[x]=(row[x]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
        else:assert kind==0
        out[y*stride:(y+1)*stride]=row;previous=row
    return out

results=[]
for n in range(28):
    a,ah,ad=read(root/f'{n}-before.png');b,bh,bd=read(root/f'{n}-after.png');identical=ah==bh and ad==bd;bounds=None;changed=0
    if not identical and ah==bh:
        ap=decode(ah,ad);bp=decode(bh,bd);identical=ap==bp
        if not identical:
            bpp=3 if ah[3]==2 else 4;left=ah[0];right=0;top=ah[1];bottom=0
            for i in range(0,len(ap),bpp):
                if ap[i:i+bpp]!=bp[i:i+bpp]:
                    pixel=i//bpp;x=pixel%ah[0];y=pixel//ah[0];left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y);changed+=1
            bounds=[left,top,right,bottom]
    r={'case':n,'dimensionsBefore':ah[:2],'dimensionsAfter':bh[:2],'identicalPixels':identical,'changedPixels':changed,'differenceBounds':bounds,'beforeSha256':hashlib.sha256(a).hexdigest(),'afterSha256':hashlib.sha256(b).hexdigest()};results.append(r)
    print(n,identical,changed,bounds,flush=True)
(root/'pixels.json').write_text(json.dumps(results,indent=2))
