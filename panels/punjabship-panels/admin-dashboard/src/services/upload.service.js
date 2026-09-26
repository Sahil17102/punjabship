import api from './axios'

export const getPresignedDownloadUrls = async (keys) => {
  const response = await api.post('/uploads/presign-download-url', { keys })

  // Assuming API returns { urls: [{ key, url }, ...] }
  if (Array.isArray(keys)) {
    return response.data.urls
  } else {
    return response.data.url
  }
}
