import { AdminLayout } from "@/components/layout";
import { useReservations } from "@/hooks/use-reservations";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Search, UserPlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertAllowedStudentSchema } from "@shared/schema";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherDashboard() {
  const { allReservations } = useReservations();
  const [filterDay, setFilterDay] = useState<string>("Monday");
  const [filterPeriod, setFilterPeriod] = useState<string>("1");
  const [search, setSearch] = useState("");

  const filteredReservations = allReservations.data?.filter(res => {
    const matchesDay = res.day === filterDay;
    const matchesPeriod = res.period === parseInt(filterPeriod);
    const matchesSearch = res.studentName.toLowerCase().includes(search.toLowerCase()) || 
                          res.seatNumber.toString().includes(search);
    return matchesDay && matchesPeriod && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search student..." 
                  className="pl-9 w-full sm:w-64 rounded-xl border-gray-200" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             
             <div className="flex gap-2">
               <Select value={filterDay} onValueChange={setFilterDay}>
                 <SelectTrigger className="w-[140px] rounded-xl border-gray-200 bg-gray-50/50">
                   <SelectValue placeholder="Day" />
                 </SelectTrigger>
                 <SelectContent>
                   {DAYS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                 </SelectContent>
               </Select>

               <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                 <SelectTrigger className="w-[120px] rounded-xl border-gray-200 bg-gray-50/50">
                   <div className="flex items-center gap-2">
                     <Filter className="w-3 h-3 text-muted-foreground" />
                     <SelectValue placeholder="Period" />
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   {PERIODS.map(p => <SelectItem key={p} value={p.toString()}>Period {p}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
          </div>

          <AddStudentDialog />
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allReservations.isLoading ? (
             Array.from({length: 8}).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : filteredReservations && filteredReservations.length > 0 ? (
            filteredReservations.map((res) => (
              <Card key={res.id} className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 border-border/60">
                <CardContent className="p-0">
                  <div className="relative h-32 bg-secondary/30">
                    <img 
                      src={res.photoUrl} 
                      alt={res.studentName} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-primary shadow-sm">
                      Seat {res.seatNumber}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-foreground truncate">{res.studentName}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                        {res.day}
                      </span>
                      <span>•</span>
                      <span>Period {res.period}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p>No reservations found for this slot.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function AddStudentDialog() {
  const { addStudentMutation } = useAdmin();
  const [open, setOpen] = useState(false);
  
  const form = useForm<z.infer<typeof insertAllowedStudentSchema>>({
    resolver: zodResolver(insertAllowedStudentSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      seatNumber: 1
    }
  });

  const onSubmit = (data: any) => {
    addStudentMutation.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Allowed Student</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="010..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={addStudentMutation.isPending}>
                {addStudentMutation.isPending ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
