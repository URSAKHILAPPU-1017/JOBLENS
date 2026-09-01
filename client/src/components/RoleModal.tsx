import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JobRole } from "@shared/types";
import { toast } from "sonner";
import { Briefcase, Building, MapPin, Tag, Wrench } from "lucide-react";

interface RoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToEdit?: JobRole | null;
  onSaveRole: (role: JobRole) => void;
}

export function RoleModal({ open, onOpenChange, roleToEdit, onSaveRole }: RoleModalProps) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("Technology");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid Level (2-4 years)");
  const [location, setLocation] = useState("Remote / Hybrid");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roleToEdit) {
      setTitle(roleToEdit.title || "");
      setCompany(roleToEdit.company || "");
      setCategory(roleToEdit.category || "Technology");
      setDescription(roleToEdit.description || "");
      setRequiredSkills((roleToEdit.requiredSkills || []).join(", "));
      setPreferredSkills((roleToEdit.preferredSkills || []).join(", "));
      setExperienceLevel(roleToEdit.experienceLevel || "Mid Level (2-4 years)");
      setLocation(roleToEdit.location || "Remote / Hybrid");
    } else {
      setTitle("");
      setCompany("");
      setCategory("Technology");
      setDescription("");
      setRequiredSkills("");
      setPreferredSkills("");
      setExperienceLevel("Mid Level (2-4 years)");
      setLocation("Remote / Hybrid");
    }
  }, [roleToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Job title is required.");
      return;
    }
    if (!description.trim()) {
      toast.error("Job description is required.");
      return;
    }

    const reqSkillsList = requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const prefSkillsList = preferredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (reqSkillsList.length === 0) {
      toast.error("Please enter at least one required skill.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        company: company.trim() || "Custom Organization",
        category: category.trim() || "General",
        description: description.trim(),
        requiredSkills: reqSkillsList,
        preferredSkills: prefSkillsList,
        experienceLevel: experienceLevel.trim(),
        location: location.trim(),
      };

      const url = roleToEdit ? `/api/roles/${roleToEdit.id}` : "/api/roles";
      const method = roleToEdit ? "PUT" : "POST";

      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || "Failed to save role.");
      }

      toast.success(roleToEdit ? "Role updated successfully!" : "New role created successfully!");
      onSaveRole(data.role);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Could not save role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#f6f1e7] text-[#16263b] rounded-[1.5rem] border border-[#ded5c5] p-6 shadow-2xl">
        <DialogHeader>
          <div className="eyebrow text-[#e7684a]">
            {roleToEdit ? "EDIT ROLE" : "CREATE CUSTOM TARGET ROLE"}
          </div>
          <DialogTitle className="font-display text-3xl tracking-[-.04em] text-[#16263b]">
            {roleToEdit ? `Edit "${roleToEdit.title}"` : "Add New Target Role"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#657180]">
            Enter job details and key requirements to analyze resumes accurately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#657180] flex items-center gap-1 mb-1">
                <Briefcase size={14} className="text-[#e7684a]" /> Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="h-11 w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#e7684a]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#657180] flex items-center gap-1 mb-1">
                <Building size={14} className="text-[#e7684a]" /> Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Tech Corp"
                className="h-11 w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#e7684a]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#657180] flex items-center gap-1 mb-1">
                <Tag size={14} className="text-[#e7684a]" /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#e7684a]"
              >
                <option value="Technology">Technology</option>
                <option value="Hardware / Engineering">Hardware / Engineering</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Management">Management</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#657180] mb-1 block">
                Experience Level
              </label>
              <input
                type="text"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                placeholder="e.g. 3-5 years"
                className="h-11 w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#e7684a]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#657180] flex items-center gap-1 mb-1">
                <MapPin size={14} className="text-[#e7684a]" /> Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote / On-site"
                className="h-11 w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#e7684a]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657180] mb-1 block">
              Job Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job summary or key responsibilities..."
              className="w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] p-3 text-sm outline-none transition focus:border-[#e7684a]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657180] flex items-center gap-1 mb-1">
              <Wrench size={14} className="text-[#e7684a]" /> Required Skills (comma-separated) *
            </label>
            <input
              type="text"
              required
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, SQL, REST API"
              className="h-11 w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#e7684a]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657180] mb-1 block">
              Preferred Skills (comma-separated)
            </label>
            <input
              type="text"
              value={preferredSkills}
              onChange={(e) => setPreferredSkills(e.target.value)}
              placeholder="e.g. Docker, AWS, GraphQL, CI/CD"
              className="h-11 w-full rounded-xl border border-[#ded5c5] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#e7684a]"
            />
          </div>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3 border-t border-[#ded5c5] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full border-[#ded5c5] bg-transparent text-sm font-bold text-[#657180]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#e7684a] px-6 text-sm font-bold text-white shadow-[4px_4px_0_#16263b] hover:bg-[#d9593d]"
            >
              {isSubmitting ? "Saving..." : roleToEdit ? "Update Role" : "Save & Select Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
