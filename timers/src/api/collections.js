import http from './http'

// 任务集相关API
const collectionApi = {
  // 获取所有任务集
  getAllCollections() {
    return http.get('/collections')
  },
  
  // 创建任务集
  createCollection(collectionData) {
    return http.post('/collections', collectionData)
  },
  
  // 获取单个任务集
  getCollectionById(id) {
    return http.get(`/collections/${id}`)
  },
  
  // 更新任务集
  updateCollection(id, collectionData) {
    return http.put(`/collections/${id}`, collectionData)
  },
  
  // 删除任务集
  deleteCollection(id) {
    return http.delete(`/collections/${id}`)
  },
  
  // 切换任务集展开状态
  toggleCollectionExpand(id) {
    return http.patch(`/collections/${id}/toggle-expand`)
  }
}

export default collectionApi