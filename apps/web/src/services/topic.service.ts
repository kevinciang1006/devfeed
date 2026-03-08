// Topic service — browse and manage user topics
import { fetchAPI } from '../lib/api'
import type { UserTopic, SaveUserTopicsRequest, GetAllTopicsResponse } from '@devfeed/shared'

export const getAllTopics = () =>
  fetchAPI<GetAllTopicsResponse['categories']>('/api/topics')

export const getUserTopics = () =>
  fetchAPI<UserTopic[]>('/api/topics/user')

export const saveUserTopics = (data: SaveUserTopicsRequest) =>
  fetchAPI<UserTopic[]>('/api/topics/user', { method: 'POST', body: JSON.stringify(data) })

export const removeUserTopic = (topicId: string) =>
  fetchAPI<{ success: boolean }>(`/api/topics/user/${topicId}`, { method: 'DELETE' })
