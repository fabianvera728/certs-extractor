import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Lock, FileKey, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCertificateExtraction } from '../contexts/backoffice/application/useCertificateExtraction';

export const UploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const { extract, loading, error, success } = useCertificateExtraction();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-pkcs12': ['.p12', '.pfx'],
    },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file && password) {
      await extract(file, password);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Certs Extractor
        </h1>
        <p className="text-gray-400 mt-2">Convert your P12/PFX to PEM securely</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : file
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`p-4 rounded-full transition-colors ${
              file ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-400 group-hover:text-white'
            }`}>
              {file ? <FileKey className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>
            <div>
              {file ? (
                <p className="font-medium text-white">{file.name}</p>
              ) : (
                <>
                  <p className="font-medium text-white">Drop your certificate here</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="Certificate password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || !password || loading}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            !file || !password
              ? 'bg-white/5 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Extracting...
            </>
          ) : (
            'Extract PEM'
          )}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {success && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">Success!</p>
              <p className="text-sm opacity-90">Your PEM file has been downloaded.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
