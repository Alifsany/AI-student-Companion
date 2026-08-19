"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useToast, type ToastType } from '@/components/ui/toast';

export function ToastListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const toastMsg = searchParams.get('toast');
    const toastType = searchParams.get('toastType') || 'success';
    
    if (toastMsg) {
      // Decode and show toast
      toast(decodeURIComponent(toastMsg), toastType as ToastType);
      
      // Remove the query param from URL without refreshing the page
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('toast');
      newSearchParams.delete('toastType');
      
      const newUrl = newSearchParams.toString() ? `${pathname}?${newSearchParams.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router, toast]);

  return null;
}
