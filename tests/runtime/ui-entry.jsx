import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {SessionProvider} from '../../src/context/SessionContext';
import AppRoutes from '../../src/routes/AppRoutes';
import BrandManagement from '../../src/pages/shoe/BrandManagement';
import InstagramReels from '../../src/admin/InstagramReels';
export {supabase} from '../../src/lib/supabase';
export function TestApp({path}){return <MemoryRouter initialEntries={[path]}><SessionProvider><AppRoutes/></SessionProvider></MemoryRouter>}
// Isolated admin component harness; access controls are exercised by the real
// route suite, PostgreSQL roles and the actual Edge handler separately.
export function TestManagement({page}){return <MemoryRouter><>{page==='brands'?<BrandManagement/>:<InstagramReels/>}</></MemoryRouter>}
