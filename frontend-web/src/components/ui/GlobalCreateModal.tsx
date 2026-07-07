import { useState } from 'react';
import Modal from './Modal';
import Button from './button';
import Input from './input';
import { tasksAPI, notesAPI } from '@/lib/api';

interface GlobalCreateModalProps {
  type: string | null;
  onClose: () => void;
}

export default function GlobalCreateModal({ type, onClose }: GlobalCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  if (!type) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (type === 'note' && noteContent.trim()) {
        await notesAPI.create({ content: noteContent });
        setNoteContent('');
        window.dispatchEvent(new Event('noteAdded'));
      }
      else if (type === 'task' && taskTitle.trim()) {
        await tasksAPI.create({ title: taskTitle, due_date: taskDue || null });
        setTaskTitle('');
        setTaskDue('');
        window.dispatchEvent(new Event('taskAdded'));
      }

      setLoading(false);
      onClose();
      // In a real app, this would refresh the respective list
      alert(`${type} created successfully!`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Error creating item.');
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'note': return 'Create Note';
      case 'company': return 'Add Company';
      case 'contact': return 'Add Contact';
      case 'lead': return 'Create Lead';
      case 'task': return 'Create Task';
      default: return `Create ${type}`;
    }
  };

  return (
    <Modal open={!!type} onClose={onClose} title={getTitle()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'note' ? (
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Note Content</label>
            <textarea 
              autoFocus
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full min-h-[150px] p-3 text-sm border border-slate-border rounded-lg bg-surface1 text-ink focus:bg-canvas focus:border-brand-500 focus:outline-none resize-y"
              placeholder="Jot down important details..."
              required
            />
          </div>
        ) : type === 'task' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Task Title</label>
              <Input autoFocus placeholder="e.g. Follow up with Acme Corp" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Due Date</label>
              <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} required />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Name / Title</label>
              <Input autoFocus placeholder="Enter name..." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Email / Contact</label>
              <Input type="email" placeholder="example@domain.com" />
            </div>
          </>
        )}
        
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-border">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
