import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, TrendingUp, BarChart3, PieChart, Users, User, Unplug } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast/ToastContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';



export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [showPasswordChangeForm] = useState(false);
    const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
    const forcePasswordChange = useRef(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [serverResponse, setServerResponse] = useState<unknown>(null);

    const [floatingElements, setFloatingElements] = useState<Array<{
        id: number;
        x: number;
        y: number;
        delay: number;
        duration: number;
    }>>([]);
    const { login, isLoading, setLoadingState } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Génération d'éléments flottants animés
    // useEffect(() => {
    //     const elements = [];
    //     for (let i = 0; i < 6; i++) {
    //         elements.push({
    //             id: i,
    //             x: Math.random() * 100,
    //             y: Math.random() * 100,
    //             delay: Math.random() * 2,
    //             duration: 3 + Math.random() * 2,
    //         });
    //     }
    //     setFloatingElements(elements);
    // }, []);



  useEffect(() => {
    const quantum_user = localStorage.getItem("quantum_user");
    if (quantum_user) {
      navigate("/", { replace: true });
    }
  }, [navigate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        try {
            let result;
            // Vérifier si le champ username a une structure pareille aux adresses mails
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(username)) {
                // Lancer la requête non ldap
                result = await login(username, password, false)
            } else {
                result = await login(username, password, true)
            }

            // Debug: afficher la réponse complète du serveur

            // Vérifier d'abord si c'est un mot de passe temporaire
            if (result.needs_password_change ||
                (result.message && result.message.includes('temporaire')) ||
                (result.error && result.error.includes('temporaire'))) {
                setUserEmail(result.user_email || username);
                setServerResponse(result);
                setLoadingState(false);
                setNeedsPasswordChange(true);
                return;
            }

            if (!result.success) {
                // Gestion des erreurs spécifiques
                let specificError = 'Identifiants incorrects. Veuillez réessayer.';

                if (result.error) {
                    const errorMsg = result.error.toLowerCase();

                    if (errorMsg.includes('mot de passe incorrect')) {
                        specificError = 'Identifiant ou mot de passe incorrect.';
                    } else if (errorMsg.includes('utilisateur inexistant') || (result.message && result.message.includes('n\'existe pas'))) {
                        specificError = result.message || 'Votre compte n\'existe pas dans notre système. Veuillez contacter l\'administrateur pour créer votre compte utilisateur.';
                    } else if (errorMsg.includes('non autorisé') || errorMsg.includes('not authorized')) {
                        specificError = 'Non autorisé à se connecter, veuillez contacter l\'admin.';
                    } else if (errorMsg.includes('account disabled') || errorMsg.includes('compte désactivé')) {
                        specificError = 'Votre compte est désactivé. Contactez l\'administrateur.';
                    } else if (errorMsg.includes('network') || errorMsg.includes('connexion')) {
                        specificError = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
                    } else if (errorMsg.includes('ldap') || errorMsg.includes('active directory')) {
                        specificError = 'Erreur d\'authentification LDAP. Vérifiez vos identifiants réseau.';
                    } else {
                        // Si le message contient déjà "Erreur d'authentification:", l'utiliser tel quel
                        if (result.message && result.message.includes('Erreur d\'authentification:')) {
                            specificError = result.message;
                        } else {
                            specificError = result.message || result.error || 'Erreur d\'authentification';
                        }
                    }
                }

                setError(specificError);
            } else {
                addToast({ message: 'Connexion réussie', type: 'success' });
                navigate('/admin');
            }
        } catch {
            setError('Erreur lors de la connexion. Veuillez réessayer.');
        }
    };

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return 'Le mot de passe doit contenir au moins 8 caractères';
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return 'Le mot de passe doit contenir au moins une lettre minuscule';
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return 'Le mot de passe doit contenir au moins une lettre majuscule';
        }
        if (!/(?=.*\d)/.test(password)) {
            return 'Le mot de passe doit contenir au moins un chiffre';
        }
        return '';
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (data.user) {
                    localStorage.setItem('quantum_user', JSON.stringify(data.user));
                }
                forcePasswordChange.current = false;
                setLoadingState(false); // Réinitialiser le loading
                addToast({ message: 'Mot de passe changé avec succès', type: 'success' });
                setNeedsPasswordChange(false);
                setNewPassword('');
                setConfirmPassword('');
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                // navigate('/'); 
            } else {
                setError(data.message || 'Erreur lors du changement de mot de passe');
            }
        } catch {
            setError('Erreur de connexion au serveur');
        }
    };

    const handleCancelPasswordChange = () => {
        setNeedsPasswordChange(false);
        forcePasswordChange.current = false;
        setNewPassword('');
        setConfirmPassword('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setError('');
        setLoadingState(false); // Réinitialiser le loading
    };

    // const statsCards = [
    //     { icon: TrendingUp, value: '24.5%', label: 'Performance', color: 'from-orange-400 to-red-500' },
    //     { icon: BarChart3, value: '892', label: 'Ventes', color: 'from-blue-400 to-purple-500' },
    //     { icon: PieChart, value: '98%', label: 'Qualité', color: 'from-green-400 to-emerald-500' },
    //     { icon: Users, value: '156', label: 'Agents', color: 'from-pink-400 to-red-500' },
    // ];

    // Debug useEffect pour surveiller les changements de state
    useEffect(() => {
        if (needsPasswordChange) {
            // console.log('FORMULAIRE DEVRAIT ETRE VISIBLE');
        }
    }, [needsPasswordChange, serverResponse, isLoading]);



    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-red-50 dark:bg-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Éléments flottants animés */}
            {floatingElements.map((el) => (
                <div
                    key={el.id}
                    className={`absolute opacity-10 `}
                    style={{
                        '--x': `${el.x}%`,
                        '--y': `${el.y}%`,
                        '--delay': `${el.delay}s`,
                        '--duration': `${el.duration}s`,
                    } as React.CSSProperties}
                >
                    <div className="animate-pulse">
                        {el.id % 4 === 0 && (
                            <TrendingUp size={24} className="text-orange-500" />
                        )}
                        {el.id % 4 === 1 && (
                            <BarChart3 size={24} className="text-blue-500" />
                        )}
                        {el.id % 4 === 2 && (
                            <PieChart size={24} className="text-green-500" />
                        )}
                        {el.id % 4 === 3 && <Users size={24} className="text-purple-500" />}
                    </div>
                </div>
            ))}

            {/* Grille de fond animée */}
            <div className="absolute inset-0 opacity-5">
                <div className="grid grid-cols-12 gap-4 h-full animate-pulse">
                    {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="bg-slate-300 rounded"></div>
                    ))}
                </div>
            </div>

            <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-32 relative z-10">

                {/* Section gauche - Branding et stats */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="mb-8">
                        <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                                FLOWUP
                            </span>
                            {/* <span className="text-slate-700">LIGHT</span> */}
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-gray-300 mb-2 pl-2">
                            La plateforme essentielle pour maîtriser vos données CSV.
                        </p>
                        <p className="text-slate-500 dark:text-gray-400 pl-2">
                            Importez, réorganisez et structurez vos fichiers pour une analyse fluide et persistante.
                        </p>

                    </div>

                    {/* Mini statistiques animées */}
                    {/* <div className="grid grid-cols-2 gap-4 mb-8 pl-2">
            {statsCards.map((stat, index) => (
              <div
                key={index}
                className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 transform hover:scale-105 transition-all duration-300 group`}
                style={{
                  '--delay': `${index * 0.1}s`,
                } as React.CSSProperties}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:rotate-12 transition-transform duration-300`}
                >
                  <stat.icon size={24} className="text-white" />
                </div>
                <div className="text-2xl font-bold text-slate-700 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div> */}
                </div>

                {/* Section droite - Formulaire de connexion */}
                <div className="flex-1 max-w-md w-full">
                    <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-orange-500/80 dark:shadow-2xl  dark:border-orange-500/50 p-8 relative overflow-hidden">
                        {/* Effet de lumière */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500  via-purple-500 to-blue-500 animate-pulse"></div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:rotate-12 transition-transform duration-300">
                                {showPasswordChangeForm ? <Lock size={32} className="text-white" /> : <Unplug  size={32} className="text-white" />}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 mb-2">
                                {showPasswordChangeForm ? 'Créer votre mot de passe' : 'Connexion'}
                            </h2>
                            <p className="text-slate-600 dark:text-gray-300">
                                {showPasswordChangeForm ? 'Veuillez créer un nouveau mot de passe sécurisé pour votre compte' : 'Accédez à votre tableau de bord'}
                            </p>
                        </div>

                        {needsPasswordChange ? (
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                {/* Affichage des erreurs */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Nouveau mot de passe */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 text-left">
                                        Nouveau mot de passe *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Entrez votre nouveau mot de passe"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirmer le mot de passe */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 text-left">
                                        Confirmer le mot de passe *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Confirmez votre nouveau mot de passe"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Critères de validation */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Le mot de passe doit contenir :</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className={`flex items-center space-x-2 text-sm ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                                                }`}></div>
                                            <span>Au moins 8 caractères</span>
                                        </div>
                                        <div className={`flex items-center space-x-2 text-sm ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${/(?=.*[a-z])/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                                                }`}></div>
                                            <span>Une lettre minuscule</span>
                                        </div>
                                        <div className={`flex items-center space-x-2 text-sm ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${/(?=.*[A-Z])/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                                                }`}></div>
                                            <span>Une lettre majuscule</span>
                                        </div>
                                        <div className={`flex items-center space-x-2 text-sm ${/(?=.*\d)/.test(newPassword) ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${/(?=.*\d)/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                                                }`}></div>
                                            <span>Un chiffre</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Boutons */}
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1"
                                        disabled={isLoading}
                                    >
                                        Changer le mot de passe
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1"
                                        onClick={handleCancelPasswordChange}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Affichage des erreurs */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Champ Username */}
                                <div className="group">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 text-left">
                                        Email ou nom d'utilisateur
                                    </label>
                                    <div className="relative">
                                        <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within:text-orange-500 transition-colors duration-200" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full h-10 pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-gray-400"
                                            placeholder="user@company.com ou john.doe"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Champ Mot de passe */}
                                <div className="group">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 text-left">
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within:text-orange-500 transition-colors duration-200" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-10 pl-12 pr-12 py-4 bg-slate-50/50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-gray-400"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors duration-200"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Bouton de soumission */}
                                <button
                                    type="submit"
                                    className="w-full cursor-pointer text-white py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-bold rounded-2xl shadow-lg"
                                    disabled={isLoading}
                                >
                                    Se connecter
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
