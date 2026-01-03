
import React, { useState, useEffect } from 'react';
import { User, Role, SkillLevel, Shift, TrainingSession, DAYS_OF_WEEK } from './types';
import { MOCK_USERS, MOCK_SHIFTS, MOCK_SESSIONS } from './constants';
import { getTrainingTips, analyzeSession } from './geminiService';

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
    <div className="aspect-video w-full rounded-2xl overflow-hidden mt-4 shadow-xl border-4 border-petrol">
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

// --- Modal for User Creation ---

const UserModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState<SkillLevel>(SkillLevel.BEGINNER);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `u-${Date.now()}`,
      name,
      phone,
      level,
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
              <input 
                type="text" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-1 uppercase tracking-widest">Telemóvel</label>
              <input 
                type="tel" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-1 uppercase tracking-widest">Nível de Jogo</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all"
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel)}
              >
                {Object.values(SkillLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
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

// --- Modal for Shift Creation ---

const ShiftModal = ({ isOpen, onClose, onSave, users }: { isOpen: boolean, onClose: () => void, onSave: (shift: Shift) => void, users: User[] }) => {
  const [day, setDay] = useState(DAYS_OF_WEEK[0]);
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState(60);
  const [level, setLevel] = useState<SkillLevel>(SkillLevel.BEGINNER);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `s-${Date.now()}`,
      dayOfWeek: day,
      startTime: time,
      durationMinutes: duration,
      studentIds: selectedStudents,
      level: level
    });
    onClose();
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const studentsOnly = users.filter(u => u.role === Role.STUDENT);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-petrol/90 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl border-4 border-padelgreen max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-bold text-petrol tracking-tight">PLANEAR TURNO</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-petrol transition-colors">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Dia da Semana</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Hora de Início</label>
              <input 
                type="time" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Duração (minutos)</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="30"
                step="15"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Nível</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-padelgreen transition-all"
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel)}
              >
                {Object.values(SkillLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-petrol/60 mb-2 uppercase tracking-widest">Seleção de Alunos</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-4 border-2 border-slate-50 rounded-[1.5rem] bg-slate-50/50">
              {studentsOnly.map(student => (
                <button
                  type="button"
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedStudents.includes(student.id) 
                      ? 'bg-petrol border-petrol text-padelgreen shadow-md' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-padelgreen'
                  }`}
                >
                  <img src={student.avatar} className="w-8 h-8 rounded-full border border-slate-200" />
                  <span className="text-xs font-bold truncate">{student.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1">Criar Turno</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Login Component ---

const Login = ({ onLogin, users, setUsers }: { onLogin: (user: User) => void, users: User[], setUsers: React.Dispatch<React.SetStateAction<User[]>> }) => {
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
    if (!user.password) {
      setStep('create');
    } else {
      setStep('password');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && selectedUser.password === password) {
      onLogin(selectedUser);
    } else {
      setError('Credenciais incorretas.');
    }
  };

  const handleCreatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('A password deve ter pelo menos 4 caracteres.');
      return;
    }
    if (selectedUser) {
      const updatedUser = { ...selectedUser, password };
      const updatedUsersList = users.map(u => u.id === selectedUser.id ? updatedUser : u);
      setUsers(updatedUsersList);
      onLogin(updatedUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-petrol p-6 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-padelgreen/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-padelgreen/10 rounded-full blur-[100px]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <img src={LOGO_URL} alt="Padel LevelUp" className="w-48 h-48 mx-auto rounded-full border-4 border-padelgreen shadow-2xl mb-6 object-cover" />
          <h1 className="font-display text-2xl font-bold text-white tracking-widest">
            PADEL <span className="text-padelgreen">LEVELUP</span>
          </h1>
          <p className="text-padelgreen/60 text-xs font-bold mt-2 tracking-[0.3em] uppercase">Sessões de treino</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border-b-8 border-padelgreen">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Telemóvel de Acesso</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-petrol">
                    <i className="fas fa-mobile-alt"></i>
                  </span>
                  <input
                    type="tel"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-petrol font-bold focus:border-padelgreen outline-none transition-all"
                    placeholder="Introduza o seu número"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
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
                <div>
                  <p className="text-xs font-bold text-petrol/50 uppercase tracking-widest">Olá,</p>
                  <p className="font-display font-bold text-petrol text-sm">{selectedUser?.name}</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-petrol">
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    autoFocus
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-petrol font-bold focus:border-padelgreen outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
              <Button type="submit" className="w-full py-4 text-base">Entrar em Campo</Button>
              <button 
                type="button" 
                onClick={() => setStep('phone')} 
                className="w-full text-petrol/40 text-[10px] font-bold uppercase tracking-widest hover:text-petrol transition-colors mt-4"
              >
                Voltar atrás
              </button>
            </form>
          )}

          {step === 'create' && (
            <form onSubmit={handleCreatePassword} className="space-y-6">
              <div className="p-5 bg-padelgreen/10 rounded-2xl border-2 border-padelgreen/20 mb-4 text-[10px] font-bold text-petrol uppercase tracking-wider leading-relaxed">
                <i className="fas fa-star mr-2 text-petrol"></i>
                Primeiro Acesso! Define a tua password de atleta para as próximas sessões.
              </div>
              <div>
                <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Criar Password</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-petrol">
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    autoFocus
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-petrol font-bold focus:border-padelgreen outline-none transition-all"
                    placeholder="Mínimo 4 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
              <Button type="submit" className="w-full py-4 text-base">Concluir Registo</Button>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-white/30 text-[10px] font-bold uppercase tracking-[0.4em]">
          LevelUp Performance © 2024
        </p>
      </div>
    </div>
  );
};

// --- Modal for Settings ---

const SettingsModal = ({ user, isOpen, onClose, onSave }: { user: User, isOpen: boolean, onClose: () => void, onSave: (newPass: string) => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError('A password deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }
    onSave(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-petrol/90 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border-4 border-padelgreen animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-display font-bold text-petrol tracking-tight text-xl">PERFIL</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-petrol transition-colors">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Nova Password</label>
              <input 
                type="password" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-padelgreen font-bold transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-petrol/50 mb-2 uppercase tracking-widest">Confirmar Password</label>
              <input 
                type="password" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-padelgreen font-bold transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1">Atualizar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [sessions, setSessions] = useState<TrainingSession[]>(MOCK_SESSIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [tips, setTips] = useState<string>("");
  const [isTipsLoading, setIsTipsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) fetchInitialTips();
  }, [currentUser]);

  const fetchInitialTips = async () => {
    setIsTipsLoading(true);
    const tip = await getTrainingTips(currentUser?.level || "Iniciante", "Padel");
    setTips(tip);
    setIsTipsLoading(false);
  };

  if (!currentUser) {
    return <Login users={users} setUsers={setUsers} onLogin={setCurrentUser} />;
  }

  const handleUpdatePassword = (newPass: string) => {
    const updatedUser = { ...currentUser, password: newPass };
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    alert('Perfil atualizado!');
  };

  const handleCreateUser = (newUser: User) => {
    setUsers([...users, newUser]);
    alert('Atleta adicionado!');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('Não podes eliminar a tua própria conta.');
      return;
    }
    if (window.confirm('Eliminar este atleta permanentemente?')) {
      setUsers(users.filter(u => u.id !== userId));
      setShifts(shifts.map(s => ({
        ...s,
        studentIds: s.studentIds.filter(sid => sid !== userId)
      })));
    }
  };

  const handleCreateShift = (newShift: Shift) => {
    setShifts([...shifts, newShift]);
    alert('Turno agendado!');
  };

  const handleDeleteShift = (shiftId: string) => {
    if (window.confirm('Eliminar este turno recorrente?')) {
      setShifts(shifts.filter(s => s.id !== shiftId));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Remover registo desta aula do histórico?')) {
      setSessions(sessions.filter(s => s.id !== sessionId));
    }
  };

  const handleActivateSession = (shiftId: string) => {
    const newSession: TrainingSession = {
      id: `ts-${Date.now()}`,
      shiftId,
      date: new Date().toLocaleDateString('pt-PT'),
      isActive: true,
      completed: false,
      attendeeIds: [],
    };
    setSessions([newSession, ...sessions]);
  };

  const handleCompleteSession = async (sessionId: string, youtubeUrl: string, notes: string) => {
    const insight = await analyzeSession(notes);
    setSessions(sessions.map(s => 
      s.id === sessionId 
      ? { ...s, isActive: false, completed: true, youtubeUrl, notes, aiInsights: insight } 
      : s
    ));
  };

  const handleConfirmAttendance = (sessionId: string) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId && !s.attendeeIds.includes(currentUser.id)) {
        return { ...s, attendeeIds: [...s.attendeeIds, currentUser.id] };
      }
      return s;
    }));
  };

  const myShifts = currentUser.role === Role.STUDENT 
    ? shifts.filter(s => s.studentIds.includes(currentUser.id))
    : shifts;

  const activeSessions = sessions.filter(s => s.isActive && (currentUser.role !== Role.STUDENT || myShifts.some(ms => ms.id === s.shiftId)));
  const pastSessions = sessions.filter(s => s.completed && (currentUser.role !== Role.STUDENT || myShifts.some(ms => ms.id === s.shiftId)));

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <SettingsModal 
        user={currentUser} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleUpdatePassword} 
      />

      <ShiftModal
        users={users}
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onSave={handleCreateShift}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleCreateUser}
      />

      <header className="sticky top-0 z-50 bg-petrol border-b-4 border-padelgreen px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} className="w-12 h-12 rounded-full border-2 border-padelgreen shadow-lg" alt="Logo" />
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-white text-lg tracking-widest leading-none">
              PADEL <span className="text-padelgreen">LEVELUP</span>
            </h1>
            <p className="text-padelgreen/50 text-[8px] font-bold tracking-[0.4em] uppercase mt-1">Sessões de treino</p>
          </div>
          {currentUser.role === Role.ADMIN && (
            <span className="bg-white text-petrol text-[8px] font-display font-bold px-2 py-0.5 rounded-full ml-2">ADMIN</span>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-sm text-white">{currentUser.name}</p>
            <p className="text-[10px] text-padelgreen font-bold uppercase tracking-wider">
              {currentUser.role === Role.ADMIN ? 'Gestor' : currentUser.role === Role.COACH ? 'Coach Pro' : `Atleta • ${currentUser.level}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-xl bg-petrol-light flex items-center justify-center text-padelgreen hover:bg-padelgreen hover:text-petrol transition-all border-2 border-white/10">
              <i className="fas fa-user-edit"></i>
            </button>
            <button onClick={() => setCurrentUser(null)} className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white hover:bg-red-600 transition-all border-2 border-white/10">
              <i className="fas fa-power-off"></i>
            </button>
          </div>
          <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-padelgreen shadow-lg" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Sidebar Space */}
        <div className="lg:col-span-4 space-y-10">
          
          <Card title="RECOMENDAÇÕES" subtitle="AI Personal Trainer" icon={<i className="fas fa-brain"></i>}>
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 italic text-petrol font-medium text-sm leading-relaxed relative">
               <i className="fas fa-quote-left absolute -top-3 -left-2 text-padelgreen text-4xl opacity-20"></i>
              {isTipsLoading ? <div className="animate-pulse flex space-y-2 flex-col"><div className="h-4 bg-slate-200 rounded w-full"></div><div className="h-4 bg-slate-200 rounded w-3/4"></div></div> : <p>"{tips}"</p>}
            </div>
            <Button variant="outline" className="mt-6 w-full text-xs" onClick={fetchInitialTips} disabled={isTipsLoading}>
              <i className="fas fa-sync-alt"></i> Atualizar Insights
            </Button>
          </Card>

          <Card 
            title={currentUser.role === Role.STUDENT ? "A MINHA AGENDA" : "PLANEAMENTO SEMANAL"} 
            subtitle="Training Shifts"
            icon={<i className="fas fa-calendar-check"></i>}
          >
            <div className="space-y-4">
              {(currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) && (
                <Button variant="primary" className="w-full mb-6" onClick={() => setIsShiftModalOpen(true)}>
                  <i className="fas fa-plus-circle"></i> NOVO TURNO
                </Button>
              )}
              {myShifts.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Sem turnos agendados</p>
                </div>
              ) : (
                myShifts.map(shift => (
                  <div key={shift.id} className="p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-petrol transition-all group relative shadow-sm hover:shadow-xl">
                    {(currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) && (
                      <button 
                        onClick={() => handleDeleteShift(shift.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-display font-bold text-petrol text-[10px] tracking-wider mb-1 uppercase">{shift.dayOfWeek}</p>
                        <p className="text-lg font-bold text-petrol leading-none">{shift.startTime}</p>
                      </div>
                      <span className="text-[9px] bg-padelgreen text-petrol px-2 py-1 rounded-lg font-black uppercase">{shift.level}</span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                       <div className="flex -space-x-2">
                        {shift.studentIds.map(sid => (
                          <img 
                            key={sid} 
                            title={users.find(u => u.id === sid)?.name}
                            src={users.find(u => u.id === sid)?.avatar} 
                            className="inline-block h-6 w-6 rounded-full border-2 border-white ring-2 ring-slate-50" 
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">{shift.durationMinutes} MIN</p>
                    </div>

                    {(currentUser.role === Role.COACH || currentUser.role === Role.ADMIN) && (
                      <Button variant="secondary" className="w-full mt-5 py-2 text-[10px] tracking-[0.2em]" onClick={() => handleActivateSession(shift.id)}>
                        ATIVAR AULA
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {currentUser.role === Role.ADMIN && (
            <Card title="DATABASE" subtitle="Atletas Registados" icon={<i className="fas fa-users-cog"></i>}>
              <Button variant="outline" className="w-full mb-6 py-2" onClick={() => setIsUserModalOpen(true)}>
                <i className="fas fa-user-plus"></i> NOVO ALUNO
              </Button>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-padelgreen transition-all group">
                    <img src={u.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-petrol truncate text-sm">{u.name}</p>
                      <p className="text-slate-400 text-[10px] font-bold tracking-widest">{u.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg uppercase font-black text-[7px] ${u.role === Role.ADMIN ? 'bg-black text-white' : 'bg-padelgreen text-petrol'}`}>
                        {u.role}
                      </span>
                      {u.id !== currentUser.id && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main Content Space */}
        <div className="lg:col-span-8 space-y-12">
          
          <section>
            <div className="flex items-center justify-between mb-8 border-b-4 border-petrol pb-4">
               <h2 className="font-display font-bold text-petrol text-2xl tracking-tight">
                COURT <span className="text-padelgreen bg-petrol px-4 py-1 ml-2">LIVE</span>
              </h2>
              <div className="flex items-center gap-2">
                 <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Sessões em Curso</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activeSessions.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center">
                  <i className="fas fa-table-tennis-paddle-ball text-slate-100 text-8xl mb-4"></i>
                  <p className="text-slate-300 font-display font-bold tracking-widest uppercase">Sem atividade no court</p>
                </div>
              ) : (
                activeSessions.map(session => (
                  <div key={session.id} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-b-padelgreen border-x-2 border-t-2 border-slate-50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-padelgreen to-petrol"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-display font-bold text-petrol text-lg tracking-tight">{shifts.find(s => s.id === session.shiftId)?.dayOfWeek}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{session.date}</p>
                      </div>
                      <i className="fas fa-running text-padelgreen text-3xl group-hover:scale-110 transition-transform"></i>
                    </div>
                    
                    {currentUser.role === Role.STUDENT ? (
                      <Button 
                        variant={session.attendeeIds.includes(currentUser.id) ? "success" : "primary"} 
                        className="w-full py-4 text-base" 
                        onClick={() => handleConfirmAttendance(session.id)} 
                        disabled={session.attendeeIds.includes(currentUser.id)}
                      >
                        {session.attendeeIds.includes(currentUser.id) ? "ESTOU PRESENTE" : "CONFIRMAR PRESENÇA"}
                      </Button>
                    ) : (
                      <div className="pt-6 border-t-2 border-slate-50 mt-4">
                        <CoachCloser onFinish={(yt, notes) => handleCompleteSession(session.id, yt, notes)} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8 border-b-4 border-petrol pb-4">
               <h2 className="font-display font-bold text-petrol text-2xl tracking-tight uppercase">
                Sessões de <span className="text-white bg-black px-4 py-1 ml-2">treino</span>
              </h2>
            </div>

            <div className="space-y-8">
              {pastSessions.length === 0 ? (
                 <div className="text-center py-20 bg-slate-100/50 rounded-[3rem] border-2 border-white">
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">A aguardar conclusão do primeiro treino</p>
                 </div>
              ) : (
                pastSessions.map(session => (
                  <div key={session.id} className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-slate-100 flex flex-col md:flex-row gap-10 relative group hover:border-padelgreen transition-all">
                    {(currentUser.role === Role.ADMIN || currentUser.role === Role.COACH) && (
                      <button 
                        onClick={() => handleDeleteSession(session.id)}
                        className="absolute top-6 right-8 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-3"
                      >
                        <i className="fas fa-trash-alt text-xl"></i>
                      </button>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">{session.date}</span>
                        <h3 className="font-display font-bold text-petrol tracking-tight text-xl">{shifts.find(s => s.id === session.shiftId)?.dayOfWeek}</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-petrol/30 uppercase tracking-[0.2em] mb-2">Relatório do Coach</p>
                          <p className="text-petrol font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border-l-4 border-petrol">{session.notes}</p>
                        </div>

                        {session.aiInsights && (
                          <div className="bg-padelgreen/10 p-6 rounded-[2rem] border-2 border-padelgreen/30 relative">
                             <div className="absolute -top-3 left-6 bg-padelgreen text-petrol text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">IA Analysis</div>
                            <div className="text-xs text-petrol font-bold leading-relaxed space-y-2 mt-2">
                              {session.aiInsights}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 flex items-center gap-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-users text-padelgreen"></i>
                          <span className="text-[10px] font-black text-petrol uppercase tracking-widest">{session.attendeeIds.length} Atletas</span>
                        </div>
                        {session.youtubeUrl && (
                          <div className="flex items-center gap-2">
                            <i className="fab fa-youtube text-red-600"></i>
                            <span className="text-[10px] font-black text-petrol uppercase tracking-widest">Resumo Disponível</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {session.youtubeUrl && (
                      <div className="w-full md:w-80 shrink-0">
                        <YouTubeEmbed url={session.youtubeUrl} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
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
         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-petrol/40 text-xs">
            <i className="fab fa-youtube"></i>
         </span>
         <input type="text" placeholder="URL VÍDEO PERFORMANCE" className="w-full text-[10px] font-bold py-3 pl-10 pr-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-padelgreen outline-none uppercase tracking-widest transition-all" value={yt} onChange={e => setYt(e.target.value)} />
      </div>
      <textarea placeholder="NOTAS TÉCNICAS E OBSERVACÕES..." className="w-full text-xs font-bold p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-32 focus:border-padelgreen outline-none uppercase tracking-widest transition-all resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
      <Button variant="secondary" className="w-full py-4" onClick={handleFinish} disabled={loading || !notes}>
        {loading ? "A ANALISAR PERFORMANCE..." : "FECHAR SESSÃO E GERAR RELATÓRIO"}
      </Button>
    </div>
  );
};
