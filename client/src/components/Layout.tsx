import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useRandomBackground } from "../hooks/useRandomBackground";
import i18n from "../i18n/config";

interface LayoutProps {
  children: React.ReactNode;
}

const SpanishFlag = () => (
  <Avatar
    variant="square"
    src="/es.webp"
    alt="ES"
    sx={{ width: "inherit", height: "inherit" }}
  />
);

const UKFlag = () => (
  <Avatar
    variant="square"
    src="/en.webp"
    alt="EN "
    sx={{ width: "inherit", height: "inherit" }}
  />
);

interface LanguageButtonProps {
  lang: string;
  flag: React.ReactNode;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  small?: boolean;
}

const LanguageButton = ({
  lang,
  flag,
  currentLanguage,
  onLanguageChange,
  small,
}: LanguageButtonProps) => (
  <Box
    onClick={() => onLanguageChange(lang)}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      minWidth: "auto",
      width: small ? 24 : 56,
      height: small ? 24 : 56,
      borderRadius: 2,
      transition: "all 0.3s ease",
      opacity: currentLanguage === lang ? 1 : 0.5,
      bgcolor:
        currentLanguage === lang
          ? "rgba(90, 127, 252, 0.3)"
          : "rgba(90, 127, 252, 0.3)",
      border:
        currentLanguage === lang
          ? "2px solid #1065E6"
          : "2px solid rgba(90, 127, 252, 0.3)",
      color: "transparent",
    }}
    title={lang === "es" ? "Español" : "English"}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {flag}
    </Box>
  </Box>
);

export default function Layout({ children }: LayoutProps) {
  const { i18n: i18nHook } = useTranslation();
  const location = useLocation();
  const currentLanguage = i18nHook.language || "es";
  const backgroundImage = useRandomBackground();

  const getNavValue = () => {
    if (location.pathname === "/inventory") return 1;
    if (location.pathname === "/recipes") return 2;
    return 0;
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        transition: "all 0.3s ease",
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          zIndex: 0,
          pointerEvents: "none",
        },
      }}
    >
      {/* Mobile Navigation */}
      <Paper
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: { xs: "block", sm: "none" },
          boxShadow: "none",
          backgroundColor: "transparent",
        }}
        elevation={0}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            height: 120,
            minHeight: 120,
            pr: 1,
            pl: 1,
            py: 1,
            overflow: "visible",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: -10,
              backgroundImage: "url(/appbar.webp)",
              backgroundRepeat: "repeat-x",
              backgroundSize: "auto 100%",
              backgroundPosition: "left top",
              filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              width: "100%",
              height: "100%",
              zIndex: 1,
              flexWrap: "wrap",
            }}
          >
            <BottomNavigation
              value={getNavValue()}
              showLabels
              sx={{
                flex: 1,
                bgcolor: "transparent",
                "& .MuiBottomNavigationAction-root": {
                  color: "rgba(16, 101, 230, 0.5)",
                  "&.Mui-selected": {
                    color: "#1065E6",
                  },
                },
              }}
            >
              <BottomNavigationAction
                disableRipple
                label={
                  <Avatar
                    variant="square"
                    src="/logo.webp"
                    alt="Home"
                    sx={{
                      width: "inherit",
                      height: "inherit",
                    }}
                  />
                }
                component={Link}
                to="/"
                slotProps={{
                  label: {
                    sx: {
                      width: "36px",
                      height: "36px",
                      transition: "all 0.3s ease",
                      "&.Mui-selected": {
                        width: "52px",
                        height: "52px",
                      },
                    },
                  },
                }}
              />
              <BottomNavigationAction
                disableRipple
                label={
                  <Avatar
                    variant="square"
                    src="/inventory.webp"
                    alt="Home"
                    sx={{
                      width: "inherit",
                      height: "inherit",
                    }}
                  />
                }
                component={Link}
                to="/inventory"
                slotProps={{
                  label: {
                    sx: {
                      width: "36px",
                      height: "36px",
                      transition: "all 0.3s ease",
                      "&.Mui-selected": {
                        width: "52px",
                        height: "52px",
                      },
                    },
                  },
                }}
              />
              <BottomNavigationAction
                disableRipple
                label={
                  <Avatar
                    variant="square"
                    src="/recipes.webp"
                    alt="Home"
                    sx={{
                      width: "inherit",
                      height: "inherit",
                    }}
                  />
                }
                component={Link}
                to="/recipes"
                slotProps={{
                  label: {
                    sx: {
                      width: "36px",
                      height: "36px",
                      transition: "all 0.3s ease",
                      "&.Mui-selected": {
                        width: "52px",
                        height: "52px",
                      },
                    },
                  },
                }}
              />
            </BottomNavigation>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                ml: 1,
              }}
            >
              <LanguageButton
                lang="es"
                flag={<SpanishFlag />}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
                small
              />
              <LanguageButton
                lang="en"
                flag={<UKFlag />}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
                small
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Desktop Navigation */}
      <Paper
        sx={{
          display: { xs: "none", sm: "block" },
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          boxShadow: "none",
          backgroundColor: "transparent",
        }}
        elevation={0}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            height: 130,
            minHeight: 130,
            pr: 1,
            pl: 1,
            py: 1,
            overflow: "visible",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: -10,
              backgroundImage: "url(/appbar.webp)",
              backgroundRepeat: "repeat-x",
              backgroundSize: "auto 100%",
              backgroundPosition: "left top",
              filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              width: "100%",
              height: "100%",
              zIndex: 1,
            }}
          >
            <BottomNavigation
              value={getNavValue()}
              showLabels
              sx={{
                flex: 1,
                bgcolor: "transparent",
                "& .MuiBottomNavigationAction-root": {
                  color: "rgba(16, 101, 230, 0.5)",
                  "&.Mui-selected": {
                    color: "#1065E6",
                  },
                },
              }}
            >
              <BottomNavigationAction
                disableRipple
                label={
                  <Avatar
                    variant="square"
                    src="/logo.webp"
                    alt="Home"
                    sx={{
                      width: "inherit",
                      height: "inherit",
                    }}
                  />
                }
                component={Link}
                to="/"
                slotProps={{
                  label: {
                    sx: {
                      width: "48px",
                      height: "48px",
                      transition: "all 0.3s ease",
                      "&.Mui-selected": {
                        width: "70px",
                        height: "70px",
                      },
                    },
                  },
                }}
              />
              <BottomNavigationAction
                disableRipple
                label={
                  <Avatar
                    variant="square"
                    src="/inventory.webp"
                    alt="Home"
                    sx={{
                      width: "inherit",
                      height: "inherit",
                    }}
                  />
                }
                component={Link}
                to="/inventory"
                slotProps={{
                  label: {
                    sx: {
                      width: "48px",
                      height: "48px",
                      transition: "all 0.3s ease",
                      "&.Mui-selected": {
                        width: "70px",
                        height: "70px",
                      },
                    },
                  },
                }}
              />
              <BottomNavigationAction
                disableRipple
                label={
                  <Avatar
                    variant="square"
                    src="/recipes.webp"
                    alt="Home"
                    sx={{
                      width: "inherit",
                      height: "inherit",
                    }}
                  />
                }
                component={Link}
                to="/recipes"
                slotProps={{
                  label: {
                    sx: {
                      width: "48px",
                      height: "48px",
                      transition: "all 0.3s ease",
                      "&.Mui-selected": {
                        width: "70px",
                        height: "70px",
                      },
                    },
                  },
                }}
              />
            </BottomNavigation>
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                ml: 2,
              }}
            >
              <LanguageButton
                lang="es"
                flag={<SpanishFlag />}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
              <LanguageButton
                lang="en"
                flag={<UKFlag />}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 1, sm: 2 },
          pt: {
            xs: "152px", // Mobile: 120px header + 16px padding + 16px extra
            sm: "162px", // Desktop: 130px header + 16px padding + 16px extra
          },
          width: "100%",
          mx: "auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
