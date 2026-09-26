import axiosInstance from './axiosInstance'

export interface StaticPage {
  slug: string
  title?: string | null
  content: string
  created_at?: string
  updated_at?: string
}

export const getStaticPage = async (slug: string): Promise<StaticPage> => {
  const res = await axiosInstance.get<{ data: StaticPage }>(`/static-pages/${slug}`)
  return res.data.data
}


