'use client';

import { useEffect } from 'react';
import { feedbackLogger } from '@/lib/feedback-logger';

export function FeedbackInitializer() {
    useEffect(() => {
        feedbackLogger.init();
    }, []);

    return null;
}
