// Simple test to debug the import issue
import { validateDateOfBirth } from '../src/utils/ageVerificationAndPrivacy';

describe('Debug Age Verification', () => {
  it('should work with direct import', () => {
    console.log('Testing validateDateOfBirth with 1990-01-01');
    const result = validateDateOfBirth('1990-01-01');
    console.log('Result:', result);
    expect(result).toBe(true);
  });
});
