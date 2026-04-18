import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';

export function MobileLayout() {
  const location = useLocation();
  const hideTab =
    ['/login', '/book', '/seats', '/confirm', '/strikes'].includes(location.pathname) ||
    location.pathname.startsWith('/ticket') ||
    location.pathname.startsWith('/appeal');

  return (
    <div className="flex justify-center min-h-screen bg-muted">
      <div className="w-full max-w-[390px] min-h-screen bg-background relative flex flex-col shadow-xl">
        <div className={`flex-1 overflow-y-auto ${hideTab ? '' : 'pb-20'}`}>
          <Outlet />
        </div>
        {!hideTab && <BottomTabBar />}
      </div>
    </div>
  );
}
