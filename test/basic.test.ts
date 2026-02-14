import { describe, it, expect } from 'vitest';

// These are tests that don't need a database - like testing math!
describe('Basic App Tests (No Database Needed)', () => {
  
  it('should do basic math', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
  });
  
  it('should work with strings', () => {
    const name = 'John Doe';
    expect(name).toContain('John');
    expect(name.split(' ')).toHaveLength(2);
  });
  
  it('should work with arrays', () => {
    const skills = ['JavaScript', 'React', 'Node.js'];
    expect(skills).toHaveLength(3);
    expect(skills[0]).toBe('JavaScript');
  });
  
  it('should work with objects', () => {
    const user = {
      name: 'Alice',
      age: 25,
      skills: ['Python', 'Django']
    };
    
    expect(user.name).toBe('Alice');
    expect(user.skills).toContain('Python');
  });
  
  it('should validate email format', () => {
    const email = 'test@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(true);
    
    const badEmail = 'not-an-email';
    expect(emailRegex.test(badEmail)).toBe(false);
  });
  
  it('should validate password strength', () => {
    const strongPassword = 'Password123!';
    const weakPassword = '123';
    
    // Strong password should be at least 8 characters
    expect(strongPassword.length).toBeGreaterThanOrEqual(8);
    expect(weakPassword.length).toBeLessThan(8);
  });
});
