export interface ThumbUrls {
  homeThumbUrl: string | null
  legacyHomeThumbUrl: string | null
}

export const getThumbUrls = (id: number, fileName: string | null): ThumbUrls => {
  if (!fileName) return { homeThumbUrl: null, legacyHomeThumbUrl: null }
  const s3Base = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
  const idPartition = String(id).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1/$2/$3')
  return {
    homeThumbUrl: `${s3Base}/locations/home_thumbs/${id}/${fileName}`,
    legacyHomeThumbUrl: `${s3Base}/locations/home_thumbs/${idPartition}/original/${fileName}`,
  }
}
