import { http, HttpResponse } from 'msw';

export const handlers = [
    // Example handler
    http.get('https://example.com/user', () => {
        return HttpResponse.json({
            id: 'c7b3d8e0-5e0b-4b7f-8b29-3e5b7e8d5e9d',
            firstName: 'John',
            lastName: 'Maverick',
        });
    }),
];
