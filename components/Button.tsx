import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const getButtonStyle = () => {
    let buttonStyle = [styles.button];
    
    // Add variant style
    switch (variant) {
      case 'primary':
        buttonStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        buttonStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        buttonStyle.push(styles.outlineButton);
        break;
      case 'danger':
        buttonStyle.push(styles.dangerButton);
        break;
    }
    
    // Add size style
    switch (size) {
      case 'small':
        buttonStyle.push(styles.smallButton);
        break;
      case 'medium':
        buttonStyle.push(styles.mediumButton);
        break;
      case 'large':
        buttonStyle.push(styles.largeButton);
        break;
    }
    
    // Add disabled style
    if (disabled || loading) {
      buttonStyle.push(styles.disabledButton);
    }
    
    // Add custom style
    if (style) {
      buttonStyle.push(style);
    }
    
    return buttonStyle;
  };
  
  const getTextStyle = () => {
    let textStyleArray = [styles.buttonText];
    
    // Add variant text style
    switch (variant) {
      case 'primary':
        textStyleArray.push(styles.primaryButtonText);
        break;
      case 'secondary':
        textStyleArray.push(styles.secondaryButtonText);
        break;
      case 'outline':
        textStyleArray.push(styles.outlineButtonText);
        break;
      case 'danger':
        textStyleArray.push(styles.dangerButtonText);
        break;
    }
    
    // Add size text style
    switch (size) {
      case 'small':
        textStyleArray.push(styles.smallButtonText);
        break;
      case 'medium':
        textStyleArray.push(styles.mediumButtonText);
        break;
      case 'large':
        textStyleArray.push(styles.largeButtonText);
        break;
    }
    
    // Add disabled text style
    if (disabled) {
      textStyleArray.push(styles.disabledButtonText);
    }
    
    // Add custom text style
    if (textStyle) {
      textStyleArray.push(textStyle);
    }
    
    return textStyleArray;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? COLORS.primary : COLORS.white} 
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginLeft: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.white,
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
  dangerButtonText: {
    color: COLORS.white,
  },
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
  disabledButtonText: {
    opacity: 0.8,
  },
});