import { faker } from '@faker-js/faker';

export function generateUsernameMale(): string {
    const first = faker.person.firstName('male').toLowerCase();
    const last = faker.person.lastName().toLowerCase();
    const num = faker.number.int({ min: 10, max: 9999 });
    return `${first}${last}${num}`.replace(/[^a-z0-9._]/g, '');
}
