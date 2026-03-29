import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default function RootPage() {
    const headersList = headers();

    const acceptLanguage = headersList.get('accept-language') || '';

    if (acceptLanguage.toLowerCase().includes('pt')) {
        redirect('/pt');
    }
    redirect('/en');
}