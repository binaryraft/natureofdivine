'use client';

import { useState, useEffect } from 'react';

export function useSeasonalTheme() {
    const [theme, setTheme] = useState<'normal' | 'christmas'>('normal');

    useEffect(() => {
        const checkSeason = () => {
            const now = new Date();
            const month = now.getMonth(); // 0-indexed (11 is December)
            const day = now.getDate();

            // Active from Dec 1st to Dec 31st
            if (month === 11 && day <= 31) {
                setTheme('christmas');
            } else {
                setTheme('normal');
            }
        };

        checkSeason();
        // Check once a day ideally, but here just on mount is fine.
    }, []);

    return theme;
}
