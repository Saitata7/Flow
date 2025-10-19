// Debug test for age verification
const validateDateOfBirth = (dateOfBirth) => {
  console.log('Input:', dateOfBirth, 'Type:', typeof dateOfBirth);
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    console.log('Failed: not string or empty');
    return false;
  }

  try {
    const birthDate = new Date(dateOfBirth);
    console.log('Parsed date:', birthDate);
    console.log('isNaN check:', isNaN(birthDate.getTime()));
    if (isNaN(birthDate.getTime())) {
      console.log('Failed: invalid date');
      return false;
    }

    const today = new Date();
    console.log('Today:', today);
    const age = today.getFullYear() - birthDate.getFullYear();
    console.log('Age calculation:', age);
    const monthDiff = today.getMonth() - birthDate.getMonth();
    console.log('Month diff:', monthDiff);
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      const result = (age - 1) >= 18;
      console.log('Result (age-1):', result);
      return result;
    }
    
    const result = age >= 18;
    console.log('Result (age):', result);
    return result;
  } catch (error) {
    console.log('Error:', error);
    return false;
  }
};

// Test the function
console.log('Testing validateDateOfBirth:');
console.log('1990-01-01:', validateDateOfBirth('1990-01-01'));
console.log('2000-01-01:', validateDateOfBirth('2000-01-01'));
console.log('1995-06-15:', validateDateOfBirth('1995-06-15'));
