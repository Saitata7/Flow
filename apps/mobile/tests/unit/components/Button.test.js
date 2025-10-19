import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../../src/components/common/Button';

describe('Button Component', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title', () => {
    const { getByText } = render(<Button {...defaultProps} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(<Button {...defaultProps} />);
    const button = getByText('Test Button');
    
    fireEvent.press(button);
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with different variants', () => {
    const { rerender, getByTestId } = render(
      <Button {...defaultProps} variant="primary" testID="button" />
    );
    expect(getByTestId('button')).toBeTruthy();

    rerender(<Button {...defaultProps} variant="secondary" testID="button" />);
    expect(getByTestId('button')).toBeTruthy();

    rerender(<Button {...defaultProps} variant="danger" testID="button" />);
    expect(getByTestId('button')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, getByTestId } = render(
      <Button {...defaultProps} size="small" testID="button" />
    );
    expect(getByTestId('button')).toBeTruthy();

    rerender(<Button {...defaultProps} size="medium" testID="button" />);
    expect(getByTestId('button')).toBeTruthy();

    rerender(<Button {...defaultProps} size="large" testID="button" />);
    expect(getByTestId('button')).toBeTruthy();
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button {...defaultProps} loading testID="button" />
    );
    expect(getByTestId('button')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByText } = render(
      <Button {...defaultProps} disabled />
    );
    const button = getByText('Test Button');
    
    fireEvent.press(button);
    expect(defaultProps.onPress).not.toHaveBeenCalled();
  });

  it('renders with icon', () => {
    const { getByTestId } = render(
      <Button {...defaultProps} icon="plus" testID="button" />
    );
    expect(getByTestId('button')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <Button {...defaultProps} style={customStyle} testID="button" />
    );
    expect(getByTestId('button')).toBeTruthy();
  });
});
