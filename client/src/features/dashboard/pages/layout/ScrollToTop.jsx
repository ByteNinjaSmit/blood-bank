import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { scrollAppToTop } from '@/lib/scroll-to-top'

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        scrollAppToTop();
    }, [pathname]);

    return null;
}

export default ScrollToTop
