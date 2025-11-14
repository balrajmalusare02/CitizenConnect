import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Container,
  Paper,
  Avatar,
  Link,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  LockOutlined,
  Email,
  Phone,
  AccountCircle,
} from '@mui/icons-material';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';

const EMBLEM_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png';

const Login = ({ onLoginSuccess }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(i18n.language);

  const [loginData, setLoginData] = useState({
    identifier: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    username: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await authService.login({
      email: loginData.identifier,
      password: loginData.password,
    });
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const result = await authService.signup({
        name: signupData.name,
        email: signupData.email,
        username: signupData.username,
        mobile: signupData.mobile,
        password: signupData.password,
      });
      if (result.success) {
        alert('Registration successful! You can now login.');
        setIsLogin(true);
        setSignupData({
          name: '',
          email: '',
          username: '',
          mobile: '',
          password: '',
          confirmPassword: '',
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Full page gradient background with animation
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(240, 147, 251, 0.2) 0%, transparent 50%)
          `,
          animation: 'gradientShift 15s ease infinite',
        },
        '@keyframes gradientShift': {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: 0.8,
          },
        },
      }}
    >
      {/* Animated floating particles */}
      {[...Array(20)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: Math.random() * 300 + 50,
            height: Math.random() * 300 + 50,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,255,255,${Math.random() * 0.1}) 0%, transparent 70%)`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 20 + 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            '@keyframes float': {
              '0%, 100%': {
                transform: 'translate(0, 0) scale(1)',
              },
              '50%': {
                transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.1)`,
              },
            },
          }}
        />
      ))}

      {/* Government branding header */}
      <Box
        sx={{
          position: 'absolute',
          top: 30,
          left: 40,
          display: 'flex',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Avatar src={EMBLEM_URL} sx={{ width: 48, height: 48, mr: 2 }} />
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
            Government of India
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            National Informatics Centre
          </Typography>
        </Box>
      </Box>

      {/* Main login card - centered */}
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 5,
              borderRadius: 5,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {/* Language Selector */}
            <FormControl size="small" sx={{ mb: 2, float: 'right' }}>
              <Select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="hi">हिंदी</MenuItem>
                <MenuItem value="mr">मराठी</MenuItem>
              </Select>
            </FormControl>

            {/* Logo and Title */}
            <Box sx={{ textAlign: 'center', mb: 3, clear: 'both' }}>
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    margin: '0 auto',
                    mb: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  <Typography sx={{ fontSize: 40 }}>🏛️</Typography>
                </Avatar>
              </motion.div>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                {t('login.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('login.subtitle')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Animated form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit}>
                  {isLogin ? (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        {t('login.welcome')}
                      </Typography>
                      <TextField
                        fullWidth
                        label={t('login.identifier')}
                        name="identifier"
                        value={loginData.identifier}
                        onChange={handleLoginChange}
                        margin="normal"
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutline color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label={t('login.password')}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={handleLoginChange}
                        margin="normal"
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          type="submit"
                          disabled={loading}
                          sx={{
                            mt: 3,
                            py: 1.8,
                            borderRadius: 2,
                            fontSize: 16,
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5568d3 0%, #6a4091 100%)',
                              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.6)',
                            },
                          }}
                        >
                          {loading ? '...' : t('login.loginButton')}
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        {t('signup.title')}
                      </Typography>
                      <TextField
                        fullWidth
                        label={t('signup.name')}
                        name="name"
                        value={signupData.name}
                        onChange={handleSignupChange}
                        margin="normal"
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountCircle color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label={t('signup.email')}
                        name="email"
                        type="email"
                        value={signupData.email}
                        onChange={handleSignupChange}
                        margin="normal"
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label={t('signup.mobile')}
                        name="mobile"
                        value={signupData.mobile}
                        onChange={handleSignupChange}
                        margin="normal"
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label={t('signup.password')}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={signupData.password}
                        onChange={handleSignupChange}
                        margin="normal"
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label={t('signup.confirmPassword')}
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={signupData.confirmPassword}
                        onChange={handleSignupChange}
                        margin="normal"
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          type="submit"
                          disabled={loading}
                          sx={{
                            mt: 3,
                            py: 1.8,
                            borderRadius: 2,
                            fontSize: 16,
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5568d3 0%, #6a4091 100%)',
                              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.6)',
                            },
                          }}
                        >
                          {loading ? '...' : t('login.signupButton')}
                        </Button>
                      </motion.div>
                    </>
                  )}

                  <Button
                    fullWidth
                    onClick={() => setIsLogin(!isLogin)}
                    sx={{
                      mt: 2,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.1)',
                      },
                    }}
                  >
                    {isLogin ? t('login.switchToSignup') : t('login.switchToLogin')}
                  </Button>
                </form>
              </motion.div>
            </AnimatePresence>
          </Paper>
        </motion.div>

        {/* Support Link */}
        <Typography
          variant="body2"
          sx={{ mt: 3, textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}
        >
          Having trouble?{' '}
          <Link href="#" underline="hover" sx={{ color: 'white', fontWeight: 'bold' }}>
            Contact Support
          </Link>
        </Typography>
      </Container>

      {/* Footer */}
      <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          bottom: 20,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        © {new Date().getFullYear()} National Informatics Centre
      </Typography>
    </Box>
  );
};

export default Login;
