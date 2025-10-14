import { ChevronLeft } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';


const ImportCsvPage: React.FC = () => {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate(-1);
    };
    return (
        <div>
            <div className='max-w-7xl mx-auto py-8 sm:px-6 lg:px-8'>
                <button onClick={handleGoBack} className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                    Importer un fichier CSV
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Cette fonctionnalité vous permet d'importer des fichiers CSV pour le traitement des données.
                </p>
            </div>
            <div className="max-w-7xl border shadow-lg m-5 mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 ">
                <div className="border-dashed border-4 border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-gray-500">Glissez-déposez votre fichier CSV ici ou cliquez pour sélectionner un fichier.</p>
                    <input type="file" accept=".csv" className="mt-4" />
                </div>
                <button  onClick={() =>console.log("Je ne suis pas encore là moi!!. Mais je fonctionne.")}   className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-100 bg-blue-500 hover:bg-blue-800">
                Importer le fichier
            </button>
            </div>
            
        </div>
    );
};
export default ImportCsvPage;


// import { ChevronLeft } from 'lucide-react';
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';


// const STORAGE_KEY = 'csv_file_content';

// function ImportCsvPage() {
//     // 1. État pour stocker le contenu du CSV (le texte)
//     const [csvContent, setCsvContent] = useState('');
//     const [fileName, setFileName] = useState('');
//     const navigate = useNavigate();
    
//     // Pour l'exemple, supposons que handleGoBack est défini
//     const handleGoBack = () => { navigate(-1) }; 
    
//     // --- Logique de Persistance (useEffect) ---
    
//     // 2. Récupérer le contenu du localStorage au montage du composant
//     useEffect(() => {
//         const persistedData = localStorage.getItem(STORAGE_KEY);
//         if (persistedData) {
//             const data = JSON.parse(persistedData);
//             setCsvContent(data.content);
//             setFileName(data.name);
//             console.log(`Contenu de ${data.name} récupéré du stockage local.`);
//         }
//     }, []);

//     // --- Fonction de Lecture et de Sauvegarde ---

//     const handleFileChange = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             setFileName(file.name);
//             const reader = new FileReader();

//             // Quand le fichier est lu
//             reader.onload = (e) => {
//                 const content = e.target.result;
//                 setCsvContent(content);

//                 // 3. Sauvegarder le contenu et le nom dans le localStorage
//                 const dataToStore = {
//                     name: file.name,
//                     content: content
//                 };
//                 localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
//             };
            
//             // Lire le fichier comme texte
//             reader.readAsText(file);
//         }
//     };


//     return (
//         <div>
//             <div className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
//                 <button onClick={handleGoBack} className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
//                     <ChevronLeft className="h-4 w-4 mr-1" /> Retour
//                 </button>
//                 <h1 className="text-3xl font-bold text-gray-900">Importer un fichier CSV</h1>
//                 <p className="mt-2 text-lg text-gray-600">Cette fonctionnalité vous permet d'importer des fichiers CSV pour le traitement des données.</p>
//             </div>
            
//             <div className="max-w-7xl border shadow-lg m-5 mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 ">
                
//                 <div className="border-dashed border-4 border-gray-300 rounded-lg p-6 text-center">
//                     {/* Afficher le statut */}
//                     {csvContent ? (
//                         <p className="text-green-600 font-medium">Fichier actuellement chargé : **{fileName}**. Contenu persistant.</p>
//                     ) : (
//                         <p className="text-gray-500">Glissez-déposez votre fichier CSV ici ou cliquez pour sélectionner un fichier.</p>
//                     )}
                    
//                     {/* Attacher la fonction handleFileChange à l'input */}
//                     <input 
//                         type="file" 
//                         accept=".csv" 
//                         className="mt-4" 
//                         onChange={handleFileChange}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// };
// export default ImportCsvPage;