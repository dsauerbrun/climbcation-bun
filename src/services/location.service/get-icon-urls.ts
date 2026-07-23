export type IconType = 'accommodation' | 'climbingType'

const ICON_PATHS: Record<IconType, string> = {
  accommodation: 'accommodations/icons',
  climbingType: 'climbing_types/icons',
}

export interface IconUrls {
  iconUrl: string | null
}

export const getIconUrls = (type: IconType, id: number, fileName: string | null): IconUrls => {
  if (!fileName) return { iconUrl: null }
  const s3Base = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
  const idPartition = String(id).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1/$2/$3')
  return {
    iconUrl: `${s3Base}/${ICON_PATHS[type]}/${idPartition}/original/${fileName}`,
  }
}
