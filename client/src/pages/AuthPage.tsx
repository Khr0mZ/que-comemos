import { SignIn, SignUp } from "@clerk/clerk-react";
import { Box, Container, Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

export default function AuthPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  // Derivar el tab directamente del parámetro en lugar de usar estado + efecto
  const tab: "sign-in" | "sign-up" = (tabParam === "sign-up" ? "sign-up" : "sign-in");
  
  const handleTabChange = (_: unknown, newValue: "sign-in" | "sign-up") => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newValue === "sign-up") {
      newSearchParams.set("tab", "sign-up");
    } else {
      newSearchParams.delete("tab");
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{ mb: 2 }}
        >
          <Tab
            label={t("auth.signIn") || "Iniciar sesión"}
            value="sign-in"
          />
          <Tab
            label={t("auth.signUp") || "Registrarse"}
            value="sign-up"
          />
        </Tabs>

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          {tab === "sign-in" ? (
            <SignIn
              routing="path"
              path="/auth"
              signUpUrl="/auth?tab=sign-up"
              fallbackRedirectUrl="/"
              signUpFallbackRedirectUrl="/auth?tab=sign-up"
              appearance={{
                elements: {
                  rootBox: {
                    width: "100%",
                  },
                  card: {
                    boxShadow: "none",
                  },
                },
              }}
            />
          ) : (
            <SignUp
              routing="path"
              path="/auth"
              signInUrl="/auth?tab=sign-in"
              fallbackRedirectUrl="/"
              signInFallbackRedirectUrl="/auth?tab=sign-in"
              appearance={{
                elements: {
                  rootBox: {
                    width: "100%",
                  },
                  card: {
                    boxShadow: "none",
                  },
                },
              }}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
}

