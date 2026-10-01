import numpy as np, sys, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SRC='/Users/macobrien/Downloads/48af97cf-483a-4b0f-8feb-f7bfbb325271.png'
OUT=sys.argv[1]
im=np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)/255
L=0.299*im[...,0]+0.587*im[...,1]+0.114*im[...,2]

# mask: largest bright component, holes filled, cut floor below feet
b=L>0.30
b=ndi.binary_opening(b,iterations=2)
lab,n=ndi.label(b)
sizes=ndi.sum(b,lab,range(1,n+1))
objs=ndi.find_objects(lab)
m=np.zeros_like(b)
for i,o in enumerate(objs):
    # garment pieces: big, start above the floor, clear of the top-left glow
    if sizes[i]>15000 and o[0].start<1250 and o[1].start>250:
        m|=lab==(i+1)
m=ndi.binary_closing(m,structure=np.ones((3,3)),iterations=14)
m=ndi.binary_fill_holes(m)
# grow slightly into darker garment shadow but not background
grow=ndi.binary_dilation(m,iterations=4)&(L>0.16)
m=m|grow
m=ndi.binary_fill_holes(m)
# floor haze beside the back foot is not garment
m[1170:, :448]=False
m[1185:1252, :496]=False
m[1185:1222, 648:720]=False
m[1245:, :470]=False
m[1268:, :500]=False
# Edge: hard core + luminance-keyed band so the rim light on the fabric
# edge is recoloured instead of left beige, and background stays clean.
core=ndi.binary_erosion(m,iterations=2)
band=ndi.binary_dilation(m,iterations=5)&~core
band[1170:, :500]=False
edge=np.clip((L-0.10)/(0.30-0.10),0,1)
alpha=np.where(core,1.0,np.where(band,edge,0.0)).astype(np.float32)
mask=np.asarray(Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)/255
Image.fromarray((mask*255).astype(np.uint8)).save('mask.png')

ref=np.percentile(L[m],88)
s=L/ref  # shading relative to lit fabric

colours=dict(l.split('=') for l in sys.argv[2:])
for slug,hx in colours.items():
    c=np.array([int(hx[i:i+2],16) for i in (1,3,5)],np.float32)/255
    lum=0.299*c[0]+0.587*c[1]+0.114*c[2]
    base=c[None,None,:]*s[...,None]
    # dark fabrics: keep form with a soft sheen from the original light
    sheen=np.clip(s-0.55,0,None)[...,None]*(0.22*(1-lum))*np.array([1.0,0.93,0.82])
    rec=np.clip(base+sheen,0,1)
    out=im*(1-mask[...,None])+rec*mask[...,None]
    Image.fromarray((out*255+0.5).astype(np.uint8)).save(os.path.join(OUT,f'{slug}.png'))
print('done',len(colours))
