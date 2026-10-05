import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loading } from "./Feedback";
import { ErrorState } from "./Feedback";
import LiveStoreEntry,{needsLiveStore} from './LiveStoreEntry';

export default function ProtectedRoute({ children }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if(needsLiveStore(location.search))return <LiveStoreEntry/>;

  if (loading) {
    return <Loading label="Checking your session..." />;
  }

  if (error) return <ErrorState error={error}/>;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname+location.search+location.hash)}`}
        replace
      />
    );
  }

  return children||<Outlet/>;
}
