import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App'
import { UserProvider } from './context/UserContext'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ChatProvider } from './context/ChatContext'
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ChatProvider>
          <App/>
        </ChatProvider>
      </UserProvider>
    </QueryClientProvider>,
  //</React.StrictMode>,
)
