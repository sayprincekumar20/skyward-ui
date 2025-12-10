import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plane, User, LogOut, ClipboardCheck } from 'lucide-react';
import { authStorage } from '@/lib/auth';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsAuthenticated(authStorage.isAuthenticated());
    setUser(authStorage.getUser());
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Plane className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">SkyBook</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/checkin">
                  <Button variant="ghost" className="gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Check-In
                  </Button>
                </Link>
                <Link to="/bookings">
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    My Bookings
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {user?.full_name}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
