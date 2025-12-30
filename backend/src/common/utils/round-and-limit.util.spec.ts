import { roundAndLimit } from './round-and-limit.util';

describe('roundAndLimit', () => {
  it('should round to 2 decimal places', () => {
    // Arrange
    const value = 123.456789;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(123.46);
  });

  it('should limit to maximum value', () => {
    // Arrange
    const value = 1500;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(1000);
  });

  it('should limit to negative maximum value', () => {
    // Arrange
    const value = -1500;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(-1000);
  });

  it('should handle zero value', () => {
    // Arrange
    const value = 0;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(0);
  });

  it('should handle negative values within limit', () => {
    // Arrange
    const value = -500.123;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(-500.12);
  });

  it('should round to 0 decimal places when decimals is 0', () => {
    // Arrange
    const value = 123.456;
    const max = 1000;
    const decimals = 0;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(123);
  });

  it('should round to 4 decimal places', () => {
    // Arrange
    const value = 123.456789;
    const max = 1000;
    const decimals = 4;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(123.4568);
  });

  it('should handle very large numbers within limit', () => {
    // Arrange
    const value = 999.999999;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(1000);
  });

  it('should handle very small numbers', () => {
    // Arrange
    const value = 0.001;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(0);
  });

  it('should handle floating point precision issues', () => {
    // Arrange
    const value = 0.1 + 0.2; // Results in 0.30000000000000004
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(0.3);
  });

  it('should handle value exactly at maximum', () => {
    // Arrange
    const value = 1000;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(1000);
  });

  it('should handle value exactly at negative maximum', () => {
    // Arrange
    const value = -1000;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(-1000);
  });

  it('should handle value slightly above maximum', () => {
    // Arrange
    const value = 1000.01;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(1000);
  });

  it('should handle value slightly below negative maximum', () => {
    // Arrange
    const value = -1000.01;
    const max = 1000;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(-1000);
  });

  it('should round correctly with many decimal places', () => {
    // Arrange
    const value = 123.456789012345;
    const max = 1000;
    const decimals = 5;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(123.45679);
  });

  it('should handle edge case with very small max', () => {
    // Arrange
    const value = 5;
    const max = 1;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(1);
  });

  it('should handle edge case with zero max', () => {
    // Arrange
    const value = 5;
    const max = 0;
    const decimals = 2;

    // Act
    const result = roundAndLimit(value, max, decimals);

    // Assert
    expect(result).toBe(0);
  });
});

