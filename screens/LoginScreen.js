import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  Animated,
  Vibration,
  Keyboard,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import firebase from '../firebase/firebaseConfig';

// Core colors
const colors = {
  primary: '#4960F9',
  secondary: '#1A1F3D',
  gray: '#888',
  lightGray: '#e0e0e0',
  error: '#e53935',
  white: '#FFFFFF',
  black: '#000000',
  background: '#23283b',
  bypass: '#28a745',
  enter: '#ff9800',
};

// Demo credentials
const DEMO_USER = {
  email: "john.smith@example.com",
  password: "Password123!",
};

// Secret keys
const BYPASS_KEY = "BYPASS2025";
const BYPASS_TAP_COUNT = 5;
const ENTER_KEY_SEQUENCE = "ENTER";

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'None', color: '#ccc' };
  
  let score = 0;
  if (password.length > 6) score += 1;
  if (password.length > 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  const strengthMap = [
    { score: 0, label: 'None', color: '#ccc' },
    { score: 1, label: 'Weak', color: '#ff4d4d' },
    { score: 2, label: 'Fair', color: '#ffa64d' },
    { score: 3, label: 'Good', color: '#ffff4d' },
    { score: 4, label: 'Strong', color: '#4dff4d' },
    { score: 5, label: 'Excellent', color: '#00cc00' },
  ];
  
  return strengthMap[score];
};

export default function LoginScreen({ onLogin, onRegister }) {
  // Screen dimensions
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  
  // State variables
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [savedUserEmail, setSavedUserEmail] = useState(null);
  
  // Form validation states
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  
  // Secret functions state
  const [bypassTapCount, setBypassTapCount] = useState(0);
  const [bypassKeyVisible, setBypassKeyVisible] = useState(false);
  const [bypassKey, setBypassKey] = useState('');
  const [showEnterButton, setShowEnterButton] = useState(false);
  const bypassTimerRef = useRef(null);
  const keySequenceTimer = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(1)).current;
  const bypassSlideIn = useRef(new Animated.Value(-100)).current;
  const enterButtonAnim = useRef(new Animated.Value(0)).current;
  const passwordStrengthWidth = useRef(new Animated.Value(0)).current;
  
  // Loading animation dots
  const loadingDot1 = useRef(new Animated.Value(0.7)).current;
  const loadingDot2 = useRef(new Animated.Value(0.7)).current;
  const loadingDot3 = useRef(new Animated.Value(0.7)).current;
  
  // Secret key sequence tracking
  let keySequence = "";

  // Key press handler for secret functions
  const handleKeyPress = (key) => {
    keySequence += key.toUpperCase();
    
    if (keySequence === ENTER_KEY_SEQUENCE) {
      keySequence = "";
      setShowEnterButton(true);
      
      Animated.spring(enterButtonAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate([0, 70, 50, 70]);
      }
    }
    
    if (keySequenceTimer.current) {
      clearTimeout(keySequenceTimer.current);
    }
    
    keySequenceTimer.current = setTimeout(() => {
      keySequence = "";
    }, 1000);
  };
  
  // Skip login via Enter button
  const handleEnterFunction = () => {
    // Feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate([0, 50, 30, 50, 30, 50]);
    }
    
    // Animation
    Animated.sequence([
      Animated.timing(containerScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setIsLoading(true);
    
    // Hide enter button
    Animated.timing(enterButtonAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowEnterButton(false);
    });
    
    // Login as guest
    setTimeout(() => {
      setIsLoading(false);
      onLogin && onLogin({
        email: 'guest@example.com',
        name: 'Guest User',
        guest: true,
      });
    }, 800);
  };

  // Load saved email on start
  useEffect(() => {
    const checkSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('userEmail');
        if (savedEmail) {
          setSavedUserEmail(savedEmail);
          setEmail(savedEmail);
          setRememberMe(true);
        } else {
          setSavedUserEmail(DEMO_USER.email);
          setEmail(DEMO_USER.email);
        }
      } catch (error) {
        console.log('Error retrieving saved email:', error);
        setSavedUserEmail(DEMO_USER.email);
        setEmail(DEMO_USER.email);
      }
    };
    
    checkSavedEmail();
  }, []);
  
  // Setup loading animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingDot1, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(loadingDot2, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(loadingDot3, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(loadingDot1, { toValue: 0.7, duration: 200, useNativeDriver: true }),
          Animated.timing(loadingDot2, { toValue: 0.7, duration: 200, useNativeDriver: true }),
          Animated.timing(loadingDot3, { toValue: 0.7, duration: 200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isLoading]);
  
  // Update password strength indicator
  useEffect(() => {
    const strength = getPasswordStrength(password);
    Animated.timing(passwordStrengthWidth, {
      toValue: strength.score / 5,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [password]);

  // Handle bypass timer
  useEffect(() => {
    if (bypassTapCount > 0) {
      bypassTimerRef.current = setTimeout(() => {
        setBypassTapCount(0);
      }, 3000);
    }
    
    return () => {
      if (bypassTimerRef.current) {
        clearTimeout(bypassTimerRef.current);
      }
    };
  }, [bypassTapCount]);

  // Keyboard effects
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        Animated.timing(logoAnim, {
          toValue: isSmallScreen ? 0.6 : 0.8,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isSmallScreen]);

  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  // Save user email 
  const saveUserEmail = async (email) => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('userEmail', email);
      } else {
        await AsyncStorage.removeItem('userEmail');
      }
    } catch (error) {
      console.log('Error saving user email:', error);
    }
  };

  // Handle logo tap for bypass
  const handleLogoTap = () => {
    const newCount = bypassTapCount + 1;
    setBypassTapCount(newCount);
    
    // Try to trigger enter key sequence
    handleKeyPress('E');
    
    // Feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(40);
    }
    
    // Show bypass key input after enough taps
    if (newCount === BYPASS_TAP_COUNT) {
      setBypassKeyVisible(true);
      Animated.timing(bypassSlideIn, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Success feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate([0, 70, 50, 70]);
      }
    }
  };

  // Handle bypass authentication
  const handleBypass = () => {
    if (bypassKey === BYPASS_KEY) {
      // Success feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate([0, 70, 50, 70, 50, 70]);
      }
      
      // Animation
      Animated.sequence([
        Animated.timing(containerScale, {
          toValue: 1.03,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      setIsLoading(true);
      
      // Error feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate(150);
      }
      
      // Error animation
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      
      setBypassKey('');
    }
  };

  // Hide bypass input
  const hideBypassInput = () => {
    Animated.timing(bypassSlideIn, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setBypassKeyVisible(false);
      setBypassKey('');
      setBypassTapCount(0);
    });
  };


  // Handle forgot password
  const handleForgotPassword = () => {
    handleKeyPress('T');
    
    if (email && validateEmail(email)) {
      Alert.alert(
        "Password Reset",
        `A password reset link has been sent to ${email}`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Email Required",
        "Please enter a valid email address to reset your password",
        [{ text: "OK" }]
      );
      setEmailError(true);
    }
  };

  // Primary action (login/register)
  const handleAction = () => {
    handleKeyPress('R');
    
    let hasError = false;

    // Reset errors
    setEmailError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);

    // Validate inputs
    if (!email || !validateEmail(email)) {
      setEmailError(true);
      hasError = true;
    }

    if (!password || !validatePassword(password)) {
      setPasswordError(true);
      hasError = true;
    }

    if (!isLogin && password !== confirmPassword) {
      setConfirmPasswordError(true);
      hasError = true;
    }

    // Show error if validation fails
    if (hasError) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate(150);
      }
      
      // Error animation
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      
      Alert.alert('Error', 'Please correct the highlighted fields');
      return;
    }

    // Start loading
    setIsLoading(true);
    
    // Button animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate(80);
    }

    // Save email if remember me is checked
    if (isLogin && rememberMe) {
      saveUserEmail(email);
    }

    // Firebase authentication
    if (isLogin) {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
          setIsLoading(false);
          onLogin && onLogin({ email, password, rememberMe });
        })
        .catch((error) => {
          setIsLoading(false);
          Alert.alert('Login Failed', error.message);
        });
    } else {
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
          setIsLoading(false);
          Alert.alert('Success', 'Account created successfully', [
            { text: 'OK', onPress: () => toggleAuthMode() },
          ]);
          onRegister && onRegister({ email, password });
        })
        .catch((error) => {
          setIsLoading(false);
          Alert.alert('Registration Failed', error.message);
        });
    }
  };

  // Handle social login
  const handleSocialLogin = (platform) => {
    if (platform === 'Google') handleKeyPress('E');
    if (platform === 'Facebook') handleKeyPress('N');
    if (platform === 'Apple') handleKeyPress('T');
    if (platform === 'Twitter') handleKeyPress('E');
    
    Alert.alert(
      `${platform} Login`,
      `${platform} login is not implemented in this demo`,
      [{ text: "OK" }]
    );
  };

  // Toggle between login and register
  const toggleAuthMode = () => {
    // Reset bypass if active
    if (bypassKeyVisible) {
      hideBypassInput();
    }
    
    // Reset errors
    setEmailError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);
    
    // Continue enter sequence
    handleKeyPress('N');
    
    // Form transition animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isLogin ? -30 : 30,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change form type
      setIsLogin(!isLogin);
      setEmail(isLogin ? '' : savedUserEmail || '');
      setPassword('');
      setConfirmPassword('');
      slideAnim.setValue(isLogin ? 30 : -30);

      // Animate in new form
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Loading dots component
  const renderLoadingDots = () => (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingDot, { opacity: loadingDot1 }]} />
      <Animated.View style={[styles.loadingDot, { opacity: loadingDot2 }]} />
      <Animated.View style={[styles.loadingDot, { opacity: loadingDot3 }]} />
    </View>
  );

  // Input field component
  const renderInputField = (
    label,
    value,
    setValue,
    placeholder,
    isSecure = false,
    showSecureText = false,
    toggleSecureText = null,
    keyboardType = 'default',
    hasError = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, hasError && styles.errorLabel]}>{label}</Text>
      <View style={[styles.textInputContainer, hasError && styles.errorInput]}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (text.length > 0 && value.length < text.length) {
              handleKeyPress(text.charAt(text.length - 1));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={isSecure && !showSecureText}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          onFocus={() => {
            if (label.includes('Password')) setPasswordFocused(true);
          }}
          onBlur={() => {
            if (label.includes('Password')) setPasswordFocused(false);
          }}
        />
        {isSecure && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={toggleSecureText}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showSecureText ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      {hasError && (
        <Text style={styles.errorText}>
          {label.includes('Email') ? 'Please enter a valid email' : 
           label.includes('Confirm') ? 'Passwords do not match' : 
           'Password must be at least 6 characters'}
        </Text>
      )}
    </View>
  );

  // Password strength component
  const renderPasswordStrength = () => {
    if (!passwordFocused && !password) return null;
    
    const strength = getPasswordStrength(password);
    
    return (
      <View style={styles.passwordStrengthContainer}>
        <Text style={styles.passwordStrengthLabel}>Password Strength: {strength.label}</Text>
        <View style={styles.passwordStrengthBg}>
          <Animated.View 
            style={[
              styles.passwordStrengthFill, 
              { 
                width: passwordStrengthWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }),
                backgroundColor: strength.color
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  // Social login buttons
  const renderSocialButtons = () => {
    const SocialButton = ({ icon, platform, color }) => (
      <TouchableOpacity 
        style={[styles.socialButton, { backgroundColor: color }]}
        onPress={() => handleSocialLogin(platform)}
        activeOpacity={0.8}
      >
        <FontAwesome5 name={icon} size={20} color={colors.white} />
      </TouchableOpacity>
    );

    return (
      <View style={styles.socialButtonsContainer}>
        <Text style={styles.socialText}>or continue with</Text>
        <View style={styles.socialIconsRow}>
          <SocialButton icon="google" platform="Google" color="#DB4437" />
          <SocialButton icon="facebook" platform="Facebook" color="#4267B2" />
          <SocialButton icon="apple" platform="Apple" color="#000000" />
          <SocialButton icon="twitter" platform="Twitter" color="#1DA1F2" />
        </View>
      </View>
    );
  };

  // Bypass key input component
  const renderBypassInput = () => {
    if (!bypassKeyVisible) return null;
    
    return (
      <Animated.View 
        style={[
          styles.bypassContainer,
          { transform: [{ translateX: bypassSlideIn }] }
        ]}
      >
        <View style={styles.bypassInputContainer}>
          <TextInput
            style={styles.bypassInput}
            placeholder="Enter bypass key"
            value={bypassKey}
            secureTextEntry
            placeholderTextColor="#aaa"
            onChangeText={(text) => {
              setBypassKey(text);
              if (text.length > 0 && bypassKey.length < text.length) {
                handleKeyPress(text.charAt(text.length - 1));
              }
            }}
          />
          <View style={styles.bypassButtons}>
            <TouchableOpacity 
              style={[styles.bypassButton, styles.bypassSubmitButton]} 
              onPress={handleBypass}
            >
              <Text style={styles.bypassButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bypassButton, styles.bypassCancelButton]} 
              onPress={hideBypassInput}
            >
              <Text style={styles.bypassCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Enter button component
  const renderEnterButton = () => {
    if (!showEnterButton) return null;
    
    return (
      <Animated.View 
        style={[
          styles.enterButtonContainer,
          {
            opacity: enterButtonAnim,
            transform: [
              { scale: enterButtonAnim },
              { translateY: enterButtonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              }) }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.enterButton}
          onPress={handleEnterFunction}
          activeOpacity={0.8}
        >
          <Text style={styles.enterButtonText}>ENTER</Text>
          <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.floatingContainer,
              {
                transform: [
                  { translateX: slideAnim },
                  { scale: containerScale }
                ],
                opacity: fadeAnim
              }
            ]}
          >
            {/* Logo */}
            <Pressable 
              onPress={handleLogoTap}
              style={styles.logoContainer}
            >
              <Animated.View
                style={[
                  styles.logoWrapper,
                  { transform: [{ scale: logoAnim }] }
                ]}
              >
                <Image 
                  source={require('../assets/logo.jpg')} 
                  style={styles.logo} 
                  resizeMode="cover" 
                />
                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoText}>
                    {isLogin ? "LOGIN" : "SIGN UP"}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>
            
            {/* Form content */}
            <View style={styles.formContent}>
             
              
              {/* Email input */}
              {renderInputField(
                'Email Address',
                email,
                setEmail,
                'Enter your email',
                false,
                false,
                null,
                'email-address',
                emailError
              )}
              
              {/* Password input */}
              {renderInputField(
                'Password',
                password,
                setPassword,
                'Enter your password',
                true,
                showPassword,
                () => setShowPassword(!showPassword),
                'default',
                passwordError
              )}
              
              {/* Password strength indicator */}
              {renderPasswordStrength()}
              
              {/* Confirm password input (only for registration) */}
              {!isLogin && renderInputField(
                'Confirm Password',
                confirmPassword,
                setConfirmPassword,
                'Confirm your password',
                true,
                showConfirmPassword,
                () => setShowConfirmPassword(!showConfirmPassword),
                'default',
                confirmPasswordError
              )}
              
              {/* Remember me checkbox and forgot password */}
              {isLogin && (
                <View style={styles.rememberForgotContainer}>
                  <TouchableOpacity 
                    style={styles.rememberContainer} 
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={15} color={colors.white} />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.forgotPassword} 
                    onPress={handleForgotPassword}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Submit button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleAction}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    renderLoadingDots()
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              {/* Social login options */}
              {renderSocialButtons()}
              
              {/* Switch between login and signup */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={toggleAuthMode}>
                  <Text style={styles.toggleButtonText}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
          
          {/* Bypass input */}
          {renderBypassInput()}
          
          {/* Enter button */}
          {renderEnterButton()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: colors.secondary,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.white,
  },
  logoTextContainer: {
    marginTop: 15,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 3,
  },
  formContent: {
    padding: 20,
  },
  savedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
  },
  savedUserText: {
    fontSize: 12,
    color: colors.gray,
    flex: 1,
  },
  savedUserEmail: {
    fontWeight: 'bold',
    color: colors.secondary,
  },
  useDemoButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  useDemoText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.secondary,
    fontWeight: '600',
  },
  errorLabel: {
    color: colors.error,
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorInput: {
    borderColor: colors.error,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: colors.secondary,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordStrengthContainer: {
    marginBottom: 15,
    marginTop: -5,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 5,
  },
  passwordStrengthBg: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 5,
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberText: {
    fontSize: 14,
    color: colors.gray,
  },
  forgotPassword: {
    paddingVertical: 5,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginHorizontal: 3,
  },
  socialButtonsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  socialText: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 15,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 14,
    color: colors.gray,
  },
  toggleButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  bypassContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.bypass,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bypassInputContainer: {
    padding: 15,
  },
  bypassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: colors.black,
  },
  bypassButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bypassButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  bypassSubmitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  bypassCancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bypassButtonText: {
    color: colors.bypass,
    fontWeight: 'bold',
  },
  bypassCancelText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  enterButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  enterButton: {
    backgroundColor: colors.enter,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  enterButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginRight: 5,
  },
});