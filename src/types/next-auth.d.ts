import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      plan: string;
      subscriptionStatus: string | null;
    };
  }

  interface User {
    plan?: string;
    subscriptionStatus?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: string;
    subscriptionStatus?: string | null;
  }
}
