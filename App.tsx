
import React, { useState, useEffect } from 'react';
import { User, Role, Shift, TrainingSession, DAYS_OF_WEEK, RecurrenceType } from './types';
import { MOCK_USERS, MOCK_SHIFTS, MOCK_SESSIONS } from './constants';
import { getTrainingTips, analyzeSession } from './geminiService';
import { supabase } from './supabaseClient';

const LOGO_URL = "https://static.wixstatic.com/media/893963_504622b311744837854746f09230198d~mv2.jpg";

// --- Helper Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }: any) => {
  const base = "px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider active:scale-95";
  const variants: any = {
    primary: "bg-padelgreen hover:bg-padelgreen-dark text-petrol shadow-[4px_4px_0px_0px_#083344] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0",
    secondary: "bg-petrol hover:bg-petrol-dark text-white border-2 border-petrol shadow-lg",
    outline: "border-2 border-petrol text-petrol hover:bg-petrol hover:text-white",
    danger: "bg-black hover:bg-red-600 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg",
    ghost: "text-slate-500 hover:bg-slate-100",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, title, subtitle, icon, className = '' }: any) => (
  <div className={`bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border-2 border-slate-100 overflow-hidden ${className}`}>
    <div className="bg-petrol p-6 flex items-center gap-4 text-white">
      {icon && <div className="w-10 h-10 rounded-xl bg-padelgreen flex items-center justify-center text-petrol text-xl">{icon}</div>}
      <div>
        <h3 className="font-display font-bold text-sm tracking-widest">{title}</h3>
        {subtitle && <p className="text-padelgreen opacity-80 text-[10px] uppercase font-bold mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const YouTubeEmbed = ({ url }: { url: string }) => {
  const getID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getID(url);
  if (!videoId) return <p className="text-red-500 text-sm italic">Link de vídeo inválido</p>;
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden mt-4 shadow-xl border-4 border-petrol bg-black">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

// --- Modals ---

const UserModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `u-${Date.now()}`,
      name,
      phone,
      role: Role.STUDENT,
      avatar: `https://i.pravatar.cc/150?u=${phone}`
    });
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-petrol/90 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border-4 border-padelgreen animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-bold text-petrol tracking-tight">NOVO ATLETA</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-petrol transition-colors">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-1 uppercase tracking-widest">Nome Completo</label>
              <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-1 uppercase tracking-widest">Telemóvel</label>
              <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1">Adicionar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ShiftModal = ({ isOpen, onClose, onSave, users }: { isOpen: boolean, onClose: () => void, onSave: (shift: Shift) => void, users: User[] }) => {
  const [day, setDay] = useState(DAYS_OF_WEEK[0]);
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState(60);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('SEMANAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `s-${Date.now()}`,
      dayOfWeek: day,
      startTime: time,
      durationMinutes: duration,
      studentIds: selectedStudents,
      recurrence: recurrence,
      startDate: startDate
    });
    onClose();
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-petrol/90 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl border-4 border-padelgreen max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-bold text-petrol tracking-tight">AGENDAR TREINO</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-petrol transition-colors">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 mb-4">
            <div className="mb-4">
              <p className="text-xs font-bold text-petrol uppercase tracking-widest mb-1">Recorrência do Treino</p>
              <p className="text-[10px] text-slate-500 font-medium">Define a frequência com que este treino ocorre</p>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-white p-1 rounded-xl border-2 border-slate-200">
                <button type="button" onClick={() => setRecurrence('PONTUAL')} className={`px-2 py-2 rounded-lg text-[9px] font-black transition-all ${recurrence === 'PONTUAL' ? 'bg-petrol text-padelgreen shadow-md' : 'text-slate-400 hover:text-petrol'}`}>PONTUAL</button>
                <button type="button" onClick={() => setRecurrence('SEMANAL')} className={`px-2 py-2 rounded-lg text-[9px] font-black transition-all ${recurrence === 'SEMANAL' ? 'bg-petrol text-padelgreen shadow-md' : 'text-slate-400 hover:text-petrol'}`}>SEMANAL</button>
                <button type="button" onClick={() => setRecurrence('QUINZENAL')} className={`px-2 py-2 rounded-lg text-[9px] font-black transition-all ${recurrence === 'QUINZENAL' ? 'bg-petrol text-padelgreen shadow-md' : 'text-slate-400 hover:text-petrol'}`}>QUINZENAL</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Data / Início</label>
              <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Dia da Semana</label>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all" value={day} onChange={(e) => setDay(e.target.value)}>
                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Hora de Início</label>
              <input type="time" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Duração (minutos)</label>
              <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} min="30" step="15" required />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Convocatória (Alunos)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-4 border-2 border-slate-50 rounded-[1.5rem] bg-slate-50/50">
              {users.filter(u => u.role === Role.STUDENT).map(student => (
                <button type="button" key={student.id} onClick={() => toggleStudent(student.id)} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${selectedStudents.includes(student.id) ? 'bg-petrol border-petrol text-padelgreen shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-padelgreen'}`}>
                  <img src={student.avatar} className="w-8 h-8 rounded-full border border-slate-200" />
                  <span className="text-xs font-bold truncate">{student.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 pt-6">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1">Confirmar Agenda</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Login Component ---

const Login = ({ onLogin, users, setUsers, connectionError }: { onLogin: (user: User) => void, users: User[], setUsers: React.Dispatch<React.SetStateAction<User[]>>, connectionError?: string }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'password' | 'create'>('phone');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.phone === phone);
    if (!user) {
      setError('Número não registado na plataforma.');
      return;
    }
    setSelectedUser(user);
    if (!user.password) setStep('create');
    else setStep('password');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && selectedUser.password === password) onLogin(selectedUser);
    else setError('Credenciais incorretas.');
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('A password deve ter pelo menos 4 caracteres.');
      return;
    }
    if (selectedUser) {
      try {
        const { error } = await supabase.from('users').update({ password }).eq('id', selectedUser.id);
        if (error) throw error;
        
        const updatedUser = { ...selectedUser, password };
        setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
        onLogin(updatedUser);
      } catch (err) {
        console.error("Supabase update error:", err);
        const updatedUser = { ...selectedUser, password };
        setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
        onLogin(updatedUser);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-petrol p-6 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-padelgreen/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-padelgreen/10 rounded-full blur-[100px]"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <img src={LOGO_URL} alt="Padel LevelUp" className="w-48 h-48 mx-auto rounded-full border-4 border-padelgreen shadow-2xl mb-6 object-cover" />
          <h1 className="font-display text-2xl font-bold text-white tracking-widest">PADEL <span className="text-padelgreen">LEVELUP</span></h1>
          <p className="text-padelgreen/60 text-xs font-bold mt-2 tracking-[0.3em] uppercase">Sessões de treino</p>
          {connectionError && (
             <div className="mt-4 bg-orange-500/20 border border-orange-500 text-orange-200 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                <i className="fas fa-exclamation-triangle mr-2"></i> Erro de Ligação: {connectionError}
             </div>
          )}
        </div>
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border-b-8 border-padelgreen">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Telemóvel de Acesso</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-petrol"><i className="fas fa-mobile-alt"></i></span>
                  <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-petrol font-bold focus:border-padelgreen outline-none transition-all" placeholder="Introduza o seu número" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
              <Button type="submit" className="w-full py-4 text-base">Próximo Passo</Button>
            </form>
          )}
          {step === 'password' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="flex items-center gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                <img src={selectedUser?.avatar} className="w-12 h-12 rounded-full border-2 border-padelgreen" />
                <div><p className="text-xs font-bold text-petrol/50 uppercase tracking-widest">Olá,</p><p className="font-display font-bold text-petrol text-sm">{selectedUser?.name}</p></div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-petrol"><i className="fas fa-lock"></i></span>
                  <input type="password" autoFocus className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-petrol font-bold focus:border-padelgreen outline-none transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
              <Button type="submit" className="w-full py-4 text-base">Entrar em Campo</Button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-petrol/40 text-[10px] font-bold uppercase tracking-widest hover:text-petrol transition-colors mt-4">Voltar atrás</button>
            </form>
          )}
          {step === 'create' && (
            <form onSubmit={handleCreatePassword} className="space-y-6">
              <div className="p-5 bg-padelgreen/10 rounded-2xl border-2 border-padelgreen/20 mb-4 text-[10px] font-bold text-petrol uppercase tracking-wider leading-relaxed"><i className="fas fa-star mr-2 text-petrol"></i>Primeiro Acesso! Define a tua password de atleta.</div>
              <div>
                <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Criar Password</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-petrol"><i className="fas fa-lock"></i></span>
                  <input type="password" autoFocus className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-petrol font-bold focus:border-padelgreen outline-none transition-all" placeholder="Mínimo 4 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
              <Button type="submit" className="w-full py-4 text-base">Concluir Registo</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [tips, setTips] = useState<string>("");
  const [isTipsLoading, setIsTipsLoading] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedHistoricalId, setSelectedHistoricalId] = useState<string | null>(null);

  // Sync with Supabase on start
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: userData, error: userErr } = await supabase.from('users').select('*');
        const { data: shiftData, error: shiftErr } = await supabase.from('shifts').select('*');
        const { data: sessionData, error: sessErr } = await supabase.from('sessions').select('*').order('date', { ascending: false });

        if (userErr) throw userErr;
        if (shiftErr) throw shiftErr;
        if (sessErr) throw sessErr;

        setUsers(userData || []);
        setShifts(shiftData || []);
        setSessions(sessionData || []);
        setConnectionError(undefined);
      } catch (err: any) {
        console.warn("Supabase connection issue:", err);
        setUsers(MOCK_USERS);
        setShifts(MOCK_SHIFTS);
        setSessions(MOCK_SESSIONS);
        setConnectionError(err.message || "Erro desconhecido. A usar dados Offline.");
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (currentUser) fetchInitialTips();
  }, [currentUser]);

  const fetchInitialTips = async () => {
    setIsTipsLoading(true);
    const tip = await getTrainingTips("Padel");
    setTips(tip);
    setIsTipsLoading(false);
  };

  const handleCreateUser = async (newUser: User) => {
    try {
      await supabase.from('users').insert([newUser]);
    } finally {
      setUsers([...users, newUser]);
      alert('Atleta adicionado!');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) return;
    if (window.confirm('Eliminar este atleta permanentemente?')) {
      try {
        await supabase.from('users').delete().eq('id', userId);
      } finally {
        setUsers(users.filter(u => u.id !== userId));
        setShifts(shifts.map(s => ({ ...s, studentIds: (s.studentIds || []).filter(sid => sid !== userId) })));
      }
    }
  };

  const handleCreateShift = async (newShift: Shift) => {
    try {
      await supabase.from('shifts').insert([newShift]);
    } finally {
      setShifts([...shifts, newShift]);
      alert('Treino agendado com sucesso!');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (window.confirm('Eliminar este agendamento?')) {
      try {
        await supabase.from('shifts').delete().eq('id', shiftId);
      } finally {
        setShifts(shifts.filter(s => s.id !== shiftId));
      }
    }
  };

  const handleActivateSession = async (shiftId: string) => {
    const newSession: TrainingSession = {
      id: `ts-${Date.now()}`,
      shiftId,
      date: new Date().toLocaleDateString('pt-PT'),
      isActive: true,
      completed: false,
      attendeeIds: [],
    };
    try {
      await supabase.from('sessions').insert([newSession]);
    } finally {
      setSessions([newSession, ...sessions]);
    }
  };

  const handleCompleteSession = async (sessionId: string, youtubeUrl: string, notes: string) => {
    const insight = await analyzeSession(notes);
    const update = { isActive: false, completed: true, youtubeUrl, notes, aiInsights: insight };
    try {
      await supabase.from('sessions').update(update).eq('id', sessionId);
    } finally {
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, ...update } : s));
    }
  };

  const handleConfirmAttendance = async (sessionId: string) => {
    if (!currentUser) return;
    const session = sessions.find(s => s.id === sessionId);
    if (session && !session.attendeeIds.includes(currentUser.id)) {
      const updatedAttendees = [...session.attendeeIds, currentUser.id];
      try {
        await supabase.from('sessions').update({ attendeeIds: updatedAttendees }).eq('id', sessionId);
      } finally {
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, attendeeIds: updatedAttendees } : s));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-petrol flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-padelgreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-display text-white text-[10px] tracking-widest uppercase opacity-50">Sincronizando Court...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} setUsers={setUsers} onLogin={setCurrentUser} connectionError={connectionError} />;
  }

  const myShifts = currentUser.role === Role.STUDENT ? shifts.filter(s => (s.studentIds || []).includes(currentUser.id)) : shifts;
  const activeSessions = sessions.filter(s => s.isActive && (currentUser.role !== Role.STUDENT || myShifts.some(ms => ms.id === s.shiftId)));
  const pastSessions = sessions.filter(s => s.completed && (currentUser.role !== Role.STUDENT || myShifts.some(ms => ms.id === s.shiftId)));

  const getRecurrenceBadge = (recurrence: RecurrenceType) => {
    switch (recurrence) {
      case 'SEMANAL':
        return (
          <span className="bg-petrol text-padelgreen text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <i className="fas fa-sync text-[7px]"></i> SEMANAL
          </span>
        );
      case 'QUINZENAL':
        return (
          <span className="bg-padelgreen-dark text-petrol text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <i className="fas fa-history text-[7px]"></i> QUINZENAL
          </span>
        );
      default:
        return (
          <span className="bg-slate-200 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">PONTUAL</span>
        );
    }
  };

  // Helper to format startDate for the Agenda
  const formatShiftDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}`;
    } catch (e) {
      return null;
    }
  };

  // Logic to handle selected session for viewing
  const currentViewSession = selectedHistoricalId ? pastSessions.find(s => s.id === selectedHistoricalId) : pastSessions[0];

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="sticky top-0 z-50 bg-petrol border-b-4 border-padelgreen px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} className="w-12 h-12 rounded-full border-2 border-padelgreen shadow-lg" alt="Logo" />
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-white text-lg tracking-widest leading-none">PADEL <span className="text-padelgreen">LEVELUP</span></h1>
            <p className="text-padelgreen/50 text-[8px] font-bold tracking-[0.4em] uppercase mt-1">Sessões de treino</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-sm text-white">{currentUser.name}</p>
            <p className="text-[10px] text-padelgreen font-bold uppercase tracking-wider">
              {currentUser.role === Role.ADMIN ? 'Gestor' : currentUser.role === Role.COACH ? 'Coach Pro' : `Atleta`}
            </p>
          </div>
          <button onClick={() => setCurrentUser(null)} className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white hover:bg-red-600 transition-all border-2 border-white/10"><i className="fas fa-power-off"></i></button>
          <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-padelgreen shadow-lg" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-10">
          <Card title="RECOMENDAÇÕES" subtitle="AI Personal Trainer" icon={<i className="fas fa-brain"></i>}>
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 italic text-petrol font-medium text-sm leading-relaxed relative">
               <i className="fas fa-quote-left absolute -top-3 -left-2 text-padelgreen text-4xl opacity-20"></i>
               {isTipsLoading ? <p className="animate-pulse">Gerando dicas...</p> : <p>"{tips}"</p>}
            </div>
          </Card>
          
          <Card title="AGENDA DE TREINOS" subtitle="Gestão de Horários" icon={<i className="fas fa-calendar-alt"></i>}>
            <div className="space-y-4">
              {(currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) && (
                <Button variant="primary" className="w-full mb-6" onClick={() => setIsShiftModalOpen(true)}>
                  <i className="fas fa-plus-circle mr-2"></i> AGENDAR NOVO
                </Button>
              )}
              {myShifts.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic uppercase">Agenda vazia</p>}
              {myShifts.map(shift => (
                <div key={shift.id} className="p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-petrol transition-all relative shadow-sm group">
                  {(currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) && (
                    <button onClick={() => handleDeleteShift(shift.id)} className="absolute top-2 right-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"><i className="fas fa-trash-alt text-[10px]"></i></button>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-display font-bold text-petrol text-[10px] uppercase flex items-center gap-1.5">
                                <i className="far fa-calendar text-[8px] text-padelgreen"></i>
                                {shift.dayOfWeek} {shift.startDate && <span className="text-padelgreen opacity-80 ml-1">[{formatShiftDate(shift.startDate)}]</span>}
                            </p>
                            {getRecurrenceBadge(shift.recurrence)}
                        </div>
                        <p className="text-xl font-bold text-petrol leading-none flex items-center gap-2">
                            {shift.startTime}
                            <span className="text-[10px] text-slate-400 font-normal">({shift.durationMinutes} min)</span>
                        </p>
                    </div>
                  </div>
                  
                  <div className="flex -space-x-2 mt-4 overflow-hidden">
                    {(shift.studentIds || []).map(sid => {
                        const student = users.find(u => u.id === sid);
                        return student ? <img key={sid} src={student.avatar} title={student.name} className="inline-block h-6 w-6 rounded-full ring-2 ring-white shadow-sm" /> : null;
                    })}
                  </div>

                  {(currentUser.role === Role.COACH || currentUser.role === Role.ADMIN) && (
                    <Button variant="secondary" className="w-full mt-5 py-2 text-[10px] font-black" onClick={() => handleActivateSession(shift.id)}>
                        COMEÇAR TREINO <i className="fas fa-play text-[8px] ml-1"></i>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {currentUser.role === Role.ADMIN && (
            <Card title="DATABASE" subtitle="Atletas" icon={<i className="fas fa-users-cog"></i>}>
              <Button variant="outline" className="w-full mb-6 py-2" onClick={() => setIsUserModalOpen(true)}>NOVO ALUNO</Button>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-padelgreen transition-all group">
                    <img src={u.avatar} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0"><p className="font-bold text-petrol truncate text-sm">{u.name}</p></div>
                    {u.id !== currentUser.id && <button onClick={() => handleDeleteUser(u.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><i className="fas fa-trash-alt"></i></button>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8 space-y-12">
          <section>
            <h2 className="font-display font-bold text-petrol text-2xl mb-8 border-b-4 border-petrol pb-4 uppercase flex items-center gap-3">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              Court <span className="text-padelgreen bg-petrol px-4 py-1 ml-2">Live</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activeSessions.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                    <i className="fas fa-table-tennis text-slate-100 text-6xl mb-4"></i>
                    <p className="text-slate-400 italic uppercase text-xs font-bold tracking-widest">Nenhum treino a decorrer no momento</p>
                </div>
              )}
              {activeSessions.map(session => (
                <div key={session.id} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-b-padelgreen border-x-2 border-t-2 border-slate-50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-padelgreen/10 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:w-32 group-hover:h-32"></div>
                  <div className="relative z-10">
                    <h3 className="font-display font-bold text-petrol text-lg mb-6 flex items-center gap-2">
                        <i className="fas fa-clock text-padelgreen"></i>
                        {shifts.find(s => s.id === session.shiftId)?.dayOfWeek}
                    </h3>
                    {currentUser.role === Role.STUDENT ? (
                        <Button 
                            variant={session.attendeeIds.includes(currentUser.id) ? "success" : "primary"} 
                            className="w-full py-4" 
                            onClick={() => handleConfirmAttendance(session.id)} 
                            disabled={session.attendeeIds.includes(currentUser.id)}
                        >
                            {session.attendeeIds.includes(currentUser.id) ? "ESTOU NO CAMPO ✅" : "CONFIRMAR PRESENÇA 🎾"}
                        </Button>
                    ) : <CoachCloser onFinish={(yt, notes) => handleCompleteSession(session.id, yt, notes)} />}
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="font-display font-bold text-petrol text-2xl mb-8 border-b-4 border-petrol pb-4 uppercase">
                Registo de <span className="text-white bg-black px-4 py-1 ml-2">Treinos</span>
            </h2>
            
            {pastSessions.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl">
                    <i className="fas fa-folder-open text-slate-100 text-6xl mb-4"></i>
                    <p className="text-slate-400 uppercase font-black text-xs tracking-widest">Ainda não tens treinos finalizados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Left: Session Explorer */}
                    <div className="lg:col-span-1 bg-white rounded-[2rem] border-2 border-slate-100 shadow-lg overflow-hidden max-h-[600px] flex flex-col">
                        <div className="p-5 bg-petrol text-white">
                            <h4 className="font-display text-[10px] font-bold tracking-widest">HISTÓRICO</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {pastSessions.map(session => (
                                <button 
                                    key={session.id}
                                    onClick={() => setSelectedHistoricalId(session.id)}
                                    className={`w-full text-left p-5 border-b border-slate-50 transition-all hover:bg-slate-50 group flex items-center justify-between ${ (selectedHistoricalId === session.id || (!selectedHistoricalId && pastSessions[0].id === session.id)) ? 'bg-slate-50 border-l-4 border-l-padelgreen' : ''}`}
                                >
                                    <div>
                                        <p className={`text-[10px] font-black uppercase mb-0.5 ${ (selectedHistoricalId === session.id || (!selectedHistoricalId && pastSessions[0].id === session.id)) ? 'text-petrol' : 'text-slate-400'}`}>
                                            {session.date}
                                        </p>
                                        <p className="font-bold text-petrol text-xs">{shifts.find(s => s.id === session.shiftId)?.dayOfWeek}</p>
                                    </div>
                                    {session.youtubeUrl && <i className="fab fa-youtube text-red-500 text-xs opacity-50 group-hover:opacity-100"></i>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Session Viewer */}
                    <div className="lg:col-span-3">
                        {currentViewSession && (
                            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border-2 border-slate-100 animate-in fade-in duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b-2 border-slate-50 pb-8">
                                    <div>
                                        <span className="text-[10px] bg-petrol text-padelgreen px-3 py-1 rounded-full font-black uppercase tracking-widest mb-3 inline-block">SESSÃO CONCLUÍDA</span>
                                        <h3 className="font-display font-bold text-petrol text-2xl">{shifts.find(s => s.id === currentViewSession.shiftId)?.dayOfWeek} • {currentViewSession.date}</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Duração Técnica</p>
                                            <p className="font-bold text-petrol">{shifts.find(s => s.id === currentViewSession.shiftId)?.durationMinutes} Minutos</p>
                                        </div>
                                        <span className="w-12 h-12 bg-padelgreen rounded-2xl flex items-center justify-center text-petrol shadow-lg">
                                            <i className="fas fa-clipboard-check text-xl"></i>
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                                    <div className="xl:col-span-3 space-y-8">
                                        <div>
                                            <h4 className="text-[10px] font-black text-petrol uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <i className="fas fa-edit text-padelgreen"></i> Apontamentos do Treinador
                                            </h4>
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 text-petrol font-medium leading-relaxed italic relative">
                                                <i className="fas fa-quote-left absolute -top-2 -left-2 text-padelgreen text-2xl opacity-40"></i>
                                                "{currentViewSession.notes}"
                                            </div>
                                        </div>

                                        {currentViewSession.aiInsights && (
                                            <div>
                                                <h4 className="text-[10px] font-black text-petrol uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <i className="fas fa-magic text-padelgreen"></i> Análise de Performance (IA)
                                                </h4>
                                                <div className="bg-padelgreen/10 p-6 rounded-[2rem] border-2 border-padelgreen/30 text-xs font-bold text-petrol leading-relaxed">
                                                    {currentViewSession.aiInsights}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="xl:col-span-2">
                                        <h4 className="text-[10px] font-black text-petrol uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <i className="fas fa-video text-padelgreen"></i> Gravação do Treino
                                        </h4>
                                        {currentViewSession.youtubeUrl ? (
                                            <div className="group relative">
                                                <YouTubeEmbed url={currentViewSession.youtubeUrl} />
                                                <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">VideoID: {currentViewSession.youtubeUrl.split('v=')[1]?.substring(0,11)}</p>
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                                                <i className="fas fa-video-slash text-slate-300 text-4xl mb-3"></i>
                                                <p className="text-[9px] text-slate-400 font-black uppercase">Sem gravação disponível</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </section>
        </div>
      </main>

      <ShiftModal users={users} isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} onSave={handleCreateShift} />
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleCreateUser} />
    </div>
  );
}

const CoachCloser = ({ onFinish }: { onFinish: (yt: string, notes: string) => void }) => {
  const [yt, setYt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    await onFinish(yt, notes);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <i className="fab fa-youtube absolute left-4 top-1/2 -translate-y-1/2 text-red-500"></i>
        <input type="text" placeholder="URL VÍDEO (OPCIONAL)" className="w-full text-[10px] py-3 pl-10 pr-4 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all" value={yt} onChange={e => setYt(e.target.value)} />
      </div>
      <textarea placeholder="RESUMO TÉCNICO DO TREINO..." className="w-full text-xs p-4 border-2 border-slate-100 rounded-2xl h-32 focus:border-petrol outline-none transition-all" value={notes} onChange={e => setNotes(e.target.value)} />
      <Button variant="secondary" className="w-full py-4" onClick={handleFinish} disabled={loading || !notes}>
        {loading ? <i className="fas fa-spinner animate-spin"></i> : "ENCERRAR SESSÃO E ANALISAR"}
      </Button>
    </div>
  );
};
