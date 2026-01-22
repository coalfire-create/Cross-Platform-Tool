import { AdminLayout } from "@/components/layout";
import { useReservations } from "@/hooks/use-reservations";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Search, UserPlus, Filter, CheckCircle, MessageSquare, ExternalLink, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertAllowedStudentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "온라인"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherDashboard() {
  const { allReservations } = useReservations();
  const [filterDay, setFilterDay] = useState<string>("월요일");
  const [filterPeriod, setFilterPeriod] = useState<string>("1");
  const [search, setSearch] = useState("");
  const [selectedResId, setSelectedResId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");

  const filteredReservations = allReservations.data?.filter(res => {
    if (filterDay === "온라인") {
      return res.type === 'online';
    }
    const matchesDay = res.day === filterDay;
    const matchesPeriod = res.period === parseInt(filterPeriod);
    const matchesSearch = res.studentName.toLowerCase().includes(search.toLowerCase()) || 
                          res.seatNumber.toString().includes(search);
    return res.type === 'onsite' && matchesDay && matchesPeriod && matchesSearch;
  });

  const handleUpdateStatus = async (id: number, status: string, teacherFeedback?: string) => {
    try {
      await apiRequest("PATCH", `/api/reservations/${id}`, { status, teacherFeedback });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setSelectedResId(null);
      setFeedback("");
    } catch (err) {
      alert("업데이트에 실패했습니다.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="학생 검색..." 
                  className="pl-9 w-full sm:w-64 rounded-xl border-gray-200" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             
             <div className="flex gap-2">
               <Select value={filterDay} onValueChange={setFilterDay}>
                 <SelectTrigger className="w-[140px] rounded-xl border-gray-200 bg-gray-50/50">
                   <SelectValue placeholder="요일" />
                 </SelectTrigger>
                 <SelectContent>
                   {DAYS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                 </SelectContent>
               </Select>

               {filterDay !== "온라인" && (
                 <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                   <SelectTrigger className="w-[120px] rounded-xl border-gray-200 bg-gray-50/50">
                     <div className="flex items-center gap-2">
                       <Filter className="w-3 h-3 text-muted-foreground" />
                       <SelectValue placeholder="교시" />
                     </div>
                   </SelectTrigger>
                   <SelectContent>
                     {PERIODS.map(p => <SelectItem key={p} value={p.toString()}>{p}교시</SelectItem>)}
                   </SelectContent>
                 </Select>
               )}
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
              <Card key={res.id} className={cn(
                "rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 border-2",
                res.status === 'confirmed' || res.status === 'answered' ? "border-emerald-100 bg-emerald-50/10" : "border-border/60"
              )}>
                <CardContent className="p-0">
                  <div className="relative h-48 bg-secondary/30 group">
                    <img 
                      src={res.photoUrl} 
                      alt={res.studentName} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-primary shadow-sm">
                        좌석 {res.seatNumber}
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur",
                        res.type === 'onsite' ? "bg-blue-500/90 text-white" : "bg-purple-500/90 text-white"
                      )}>
                        {res.type === 'onsite' ? <MapPin className="w-3 h-3 inline mr-1" /> : <Globe className="w-3 h-3 inline mr-1" />}
                        {res.type === 'onsite' ? '현장' : '온라인'}
                      </div>
                    </div>
                    <a 
                      href={res.photoUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-foreground truncate">{res.studentName}</h3>
                      {res.status !== 'pending' && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    {res.content && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 bg-muted/50 p-2 rounded-lg italic">
                        "{res.content}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                        {res.day}
                      </span>
                      {res.type === 'onsite' && (
                        <>
                          <span>•</span>
                          <span>{res.period}교시</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 pb-4 pt-0 gap-2">
                  {res.type === 'onsite' ? (
                    <Button 
                      className="w-full rounded-xl" 
                      variant={res.status === 'confirmed' ? "outline" : "default"}
                      disabled={res.status === 'confirmed'}
                      onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                    >
                      {res.status === 'confirmed' ? "확인됨" : "확인 완료"}
                    </Button>
                  ) : (
                    <Dialog open={selectedResId === res.id} onOpenChange={(open) => !open && setSelectedResId(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full rounded-xl"
                          variant={res.status === 'answered' ? "outline" : "default"}
                          onClick={() => {
                            setSelectedResId(res.id);
                            setFeedback(res.teacherFeedback || "");
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {res.status === 'answered' ? "답변 수정" : "답변 달기"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>{res.studentName} 학생 질문 답변</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="aspect-video rounded-xl overflow-hidden border">
                            <img src={res.photoUrl} className="w-full h-full object-contain bg-muted" alt="Question" />
                          </div>
                          {res.content && (
                            <div className="bg-muted p-3 rounded-xl text-sm">
                              <strong>질문 내용:</strong> {res.content}
                            </div>
                          )}
                          <Textarea 
                            placeholder="답변을 입력해주세요..." 
                            className="min-h-[150px] rounded-xl"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button 
                            className="w-full rounded-xl"
                            onClick={() => handleUpdateStatus(res.id, 'answered', feedback)}
                          >
                            답변 저장
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p>해당 조건에 맞는 질문이 없습니다.</p>
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
          학생 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>수강생 명단 추가</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl><Input placeholder="홍길동" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>전화번호</FormLabel>
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
                  <FormLabel>좌석 번호</FormLabel>
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
                {addStudentMutation.isPending ? "추가 중..." : "학생 추가"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
