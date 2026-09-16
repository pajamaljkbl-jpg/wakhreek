const DIRECT_TYPES = new Set(['image/jpeg','image/png','image/webp'])

function loadImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file)
    const image=new Image()
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image)}
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image illisible sur cet appareil.'))}
    image.src=url
  })
}

export async function prepareCommunicationImage(file){
  if(!file)throw new Error('Aucune image sélectionnée.')
  if(!file.type?.startsWith('image/'))throw new Error('Le fichier sélectionné n’est pas une image.')
  if(file.size>50*1024*1024)throw new Error('Image trop volumineuse (50 Mo maximum).')
  if(DIRECT_TYPES.has(file.type))return file

  const image=await loadImage(file)
  const max=2560
  const scale=Math.min(1,max/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height))
  const width=Math.max(1,Math.round((image.naturalWidth||image.width)*scale))
  const height=Math.max(1,Math.round((image.naturalHeight||image.height)*scale))
  const canvas=document.createElement('canvas')
  canvas.width=width;canvas.height=height
  const context=canvas.getContext('2d')
  if(!context)throw new Error('Conversion de l’image impossible.')
  context.drawImage(image,0,0,width,height)
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.9))
  if(!blob)throw new Error('Conversion de l’image impossible.')
  return new File([blob],`wakhreek-${Date.now()}.jpg`,{type:'image/jpeg'})
}
