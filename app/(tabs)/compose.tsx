import { useEffect } from 'react';
import { router } from 'expo-router';

export default function ComposeRedirect() {
    useEffect(() => {
        // Redirect to feed with compose flag so feed opens the create modal
        router.replace('/(tabs)/feed?compose=1');
    }, []);

    return null;
}
