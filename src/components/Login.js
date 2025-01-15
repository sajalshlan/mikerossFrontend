import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <SignIn 
          routing="path" 
          path="/login" 
          signUpUrl="/sign-up"
          afterSignInUrl="/analyzer"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "rounded-xl shadow-lg",
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;