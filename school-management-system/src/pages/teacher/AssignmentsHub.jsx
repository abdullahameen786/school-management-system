// src/pages/teacher/AssignmentsHub.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Plus, Clipboard, Calendar, FileText, Trash2, ShieldAlert, BookOpen, X, FileUp, Paperclip, Loader2, Edit2 } from 'lucide-react';

const AssignmentsHub = () => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null); 
  
  // UPGRADED: Added dueTime field
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    maxMarks: '10', 
    dueDate: '',
    dueTime: '',
    attachmentUrl: '',
    attachmentName: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'];

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyClasses(fetched);
        if (fetched.length > 0) {
          setSelectedClass(fetched[0].id);
        }
      } catch (error) {
        console.error("Error loading classes:", error);
      }
    };
    if (user?.uid) fetchClasses();
  }, [user]);

  const fetchAssignments = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'assignments'), where('classId', '==', selectedClass));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAssignments(fetched);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedClass]);

  // UPGRADED: Populate dueTime on Edit
  const handleEditClick = (task) => {
    setEditingAssignmentId(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      maxMarks: task.maxMarks.toString(),
      dueDate: task.dueDate,
      dueTime: task.dueTime || '', // Map existing time if available
      attachmentUrl: task.attachmentUrl || '',
      attachmentName: task.attachmentName || ''
    });
    setSelectedFile(null);
    setFileError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setFileError('Invalid format! Supported: PDF, DOCX, PPTX, XLSX, ZIP.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError('File size triggers security blocker! Maximum allowed size is 2MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    e.target.value = ''; 
  };

  const removeUploadedFile = (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    setSelectedFile(null);
    setFileError('');
    setFormData(prev => ({ ...prev, attachmentUrl: '', attachmentName: '' }));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      let finalAttachmentUrl = formData.attachmentUrl;
      let finalAttachmentName = formData.attachmentName;

      if (selectedFile) {
        finalAttachmentName = selectedFile.name;
        const storageRef = ref(storage, `assignments/${selectedClass}/${Date.now()}_${selectedFile.name}`);
        const uploadSnapshot = await uploadBytes(storageRef, selectedFile);
        finalAttachmentUrl = await getDownloadURL(uploadSnapshot.ref);
      }

      // Payload include dueTime
      const payload = {
        classId: selectedClass,
        title: formData.title,
        description: formData.description,
        maxMarks: parseInt(formData.maxMarks),
        dueDate: formData.dueDate,
        dueTime: formData.dueTime, // Saving Time Data
        attachmentUrl: finalAttachmentUrl,
        attachmentName: finalAttachmentName,
      };

      if (editingAssignmentId) {
        await updateDoc(doc(db, 'assignments', editingAssignmentId), {
          ...payload,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'assignments'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
      }

      closeModal();
      fetchAssignments();
    } catch (error) {
      console.error("Error saving assignment:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAssignmentId(null);
    setSelectedFile(null);
    setFileError('');
    setFormData({ title: '', description: '', maxMarks: '10', dueDate: '', dueTime: '', attachmentUrl: '', attachmentName: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this assignment post permanently?")) {
      try {
        await deleteDoc(doc(db, 'assignments', id));
        fetchAssignments();
      } catch (error) {
        console.error("Error deleting assignment:", error);
      }
    }
  };

  // Helper to elegantly format 24h time to 12h AM/PM format (Optional but nice)
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hourString, minute] = timeStr.split(':');
    const hour = +hourString % 24;
    return (hour % 12 || 12) + ':' + minute + (hour < 12 ? ' AM' : ' PM');
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assignments Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Publish coursework assignments and tasks.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              {myClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.className} ({cls.section})</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedClass}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:bg-emerald-400 cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm text-slate-400">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No assignments published for this class yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow flex flex-col justify-between">
              
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditClick(task)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit Assignment"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Assignment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 pr-16">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Clipboard className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{task.title}</h3>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">{task.description}</p>
                
                {task.attachmentUrl && (
                  <a 
                    href={task.attachmentUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors w-fit max-w-full"
                  >
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{task.attachmentName || 'View Attachment'}</span>
                  </a>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-semibold text-slate-400 mt-5">
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Marks: <span className="text-slate-700">{task.maxMarks}</span></span>
                {/* UPGRADED: Dynamic Date and Time Rendering */}
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600">
                  <Calendar className="h-3.5 w-3.5" /> Due: {task.dueDate} {task.dueTime ? `at ${formatTime(task.dueTime)}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingAssignmentId ? 'Edit Assignment' : 'Publish New Assignment'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="e.g. Assignment 1: Word Embeddings"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Task Details / Instructions</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  placeholder="Provide details about expectations..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Reference File <span className="text-xs font-normal text-slate-400">(Optional - Max 2MB)</span></label>
                <div className={`mt-1 border-2 border-dashed rounded-xl p-4 text-center transition-all relative ${(selectedFile || formData.attachmentName) ? 'border-emerald-500 bg-emerald-50/20' : fileError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}>
                  
                  {!(selectedFile || formData.attachmentName) && (
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                  )}

                  <div className="space-y-1 text-xs">
                    {(selectedFile || formData.attachmentName) ? (
                      <div className="flex items-center justify-between bg-white px-3 py-2 border border-emerald-100 rounded-xl max-w-full z-20 relative shadow-sm">
                        <div className="flex items-center gap-2 truncate text-emerald-800 font-semibold pr-2">
                          <Paperclip className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[160px] sm:max-w-[240px]">
                            {selectedFile ? selectedFile.name : formData.attachmentName}
                          </span>
                          {selectedFile && (
                            <span className="text-[10px] text-emerald-500 font-normal shrink-0">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={removeUploadedFile}
                          className="text-slate-400 hover:text-rose-600 rounded-lg p-1 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FileUp className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                        <p className="font-medium text-slate-600">Click to upload or drag files here</p>
                        <p className="text-slate-400 text-[10px]">Supports: PDF, Word, PowerPoint, Excel, ZIP up to 2MB</p>
                      </>
                    )}
                  </div>
                </div>
                {fileError && <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">⚠️ {fileError}</p>}
              </div>

              {/* UPGRADED: 3-Column Grid for Metrics, Date, and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Time</label>
                  <input
                    type="time"
                    required
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 shadow-sm flex items-center justify-center min-w-[140px] cursor-pointer"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (editingAssignmentId ? 'Save Changes' : 'Publish Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsHub;