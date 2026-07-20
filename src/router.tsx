import { createBrowserRouter } from 'react-router'

import { ConsoleHome } from './console/ConsoleHome'
import { ConsoleLayout } from './console/ConsoleLayout'
import { Landing } from './Landing'
import { PortalHome } from './portal/PortalHome'
import { PortalLayout } from './portal/PortalLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/console',
    element: <ConsoleLayout />,
    children: [{ index: true, element: <ConsoleHome /> }],
  },
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [{ index: true, element: <PortalHome /> }],
  },
])
