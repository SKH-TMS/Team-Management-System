"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "./Navbar/page";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  CheckSquare,
  LayoutGrid,
  Users,
  BarChart2,
  ArrowRight,
  Zap,
  MessageSquare,
  Target,
  Quote,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Award,
  Shield,
  LineChart,
  Sparkles,
  BellRing,
  MessagesSquare,
  Gauge,
  Rocket,
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  const goToUserLogin = () => router.push("/userData/LoginUser");
  const goToAdminLogin = () => router.push("/adminData/LoginAdmin");

  const fadeIn = (delay = 0) => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay, ease: "easeOut" },
    },
  });

  const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren, delayChildren },
    },
  });

  const cardHover = {
    rest: { scale: 1, y: 0, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.08)" },
    hover: {
      scale: 1.03,
      y: -5,
      boxShadow: "0px 15px 25px rgba(0, 0, 0, 0.12)",
    },
  };

  const features = [
    {
      icon: LayoutGrid,
      title: "Unified Dashboard",
      description:
        "Oversee all projects, tasks, and team activities from a single, intuitive interface with real-time updates and customizable views.",
      color: "from-teal-400 to-teal-600",
    },
    {
      icon: CheckSquare,
      title: "Efficient Task Tracking",
      description:
        "Create, assign, prioritize, and monitor tasks with deadlines, dependencies, and automated status updates to ensure nothing falls through the cracks.",
      color: "from-emerald-400 to-teal-500",
    },
    {
      icon: Users,
      title: "Seamless Collaboration",
      description:
        "Manage team structures, roles, and facilitate clear communication channels with integrated messaging and file sharing capabilities.",
      color: "from-teal-500 to-emerald-600",
    },
    {
      icon: Calendar,
      title: "Project Timeline Management",
      description:
        "Visualize project timelines, milestones, and deadlines with interactive Gantt charts and calendar integrations.",
      color: "from-cyan-500 to-teal-600",
    },
    {
      icon: BellRing,
      title: "Smart Notifications",
      description:
        "Stay informed with customizable alerts for task deadlines, project updates, and team communications.",
      color: "from-teal-500 to-cyan-600",
    },
    {
      icon: LineChart,
      title: "Performance Analytics",
      description:
        "Gain insights into team productivity, project progress, and resource allocation with detailed reports and visualizations.",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  const howItWorksSteps = [
    {
      icon: Zap,
      title: "Sign Up / Login",
      description:
        "Quickly register your team or log in to your existing account with secure authentication options.",
      number: "01",
    },
    {
      icon: Users,
      title: "Create Teams & Projects",
      description:
        "Organize your workforce into teams and set up your project workspaces with customizable templates.",
      number: "02",
    },
    {
      icon: Target,
      title: "Assign & Track Tasks",
      description:
        "Delegate tasks to team members and monitor progress towards project goals with intuitive tracking tools.",
      number: "03",
    },
    {
      icon: MessagesSquare,
      title: "Collaborate & Communicate",
      description:
        "Exchange ideas, share updates, and provide feedback through integrated communication channels.",
      number: "04",
    },
  ];

  const testimonials = [
    {
      quote:
        "This system revolutionized how our department manages final year projects. Communication between students and supervisors has improved dramatically, and tracking progress has never been easier.",
      name: "Dr. Sarah Johnson",
      title: "Computer Science Department Head",
      avatar: "/avatars/sarah.png",
    },
    {
      quote:
        "As a project supervisor, I can finally keep track of all my teams in one place. The clear task assignments and deadline tracking have eliminated confusion and improved student accountability.",
      name: "Prof. Michael Chen",
      title: "Project Supervisor",
      avatar: "/avatars/michael.png",
    },
    {
      quote:
        "Our final year project team used to struggle with communication and task management. This platform has transformed our workflow and helped us deliver a much higher quality project on time.",
      name: "Aisha Rahman",
      title: "Computer Science Student",
      avatar: "/avatars/aisha.png",
    },
  ];

  const stats = [
    { value: "94%", label: "Increase in team productivity", icon: Gauge },
    { value: "78%", label: "Reduction in missed deadlines", icon: Clock },
    {
      value: "86%",
      label: "Improvement in communication clarity",
      icon: MessageSquare,
    },
    { value: "3.5x", label: "Faster project completion rate", icon: Rocket },
  ];

  const faqs = [
    {
      question: "How does the team assignment process work?",
      answer:
        "Project managers can create teams, add members, and assign a team leader. They can then create projects and assign them to specific teams. Team leaders can further break down projects into tasks and assign them to team members.",
    },
    {
      question: "Can supervisors track multiple teams simultaneously?",
      answer:
        "Yes, supervisors (project managers) can oversee multiple teams from a unified dashboard, with real-time updates on progress, task completion, and upcoming deadlines across all projects.",
    },
    {
      question: "Is there a mobile app available?",
      answer:
        "We offer a responsive web application that works seamlessly on mobile devices. A dedicated mobile app for iOS and Android is currently in development and will be released soon.",
    },
    {
      question: "How secure is the platform for sharing project data?",
      answer:
        "Our platform employs industry-standard encryption, secure authentication, and role-based access controls to ensure that sensitive project data is protected and only accessible to authorized team members.",
    },
  ];

  const roleTabs = [
    {
      role: "Project Managers",
      icon: BarChart2,
      features: [
        "Create and manage multiple teams",
        "Assign projects to appropriate teams",
        "Monitor progress across all projects",
        "Generate performance reports",
        "Streamline communication with team leaders",
      ],
    },
    {
      role: "Team Leaders",
      icon: Target,
      features: [
        "Break down projects into manageable tasks",
        "Assign tasks to team members based on skills",
        "Track task completion and deadlines",
        "Provide feedback and guidance",
        "Report progress to project managers",
      ],
    },
    {
      role: "Team Members",
      icon: CheckSquare,
      features: [
        "View and manage assigned tasks",
        "Update task status and progress",
        "Collaborate with team members",
        "Receive notifications for deadlines",
        "Submit completed work for review",
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Navbar />
      <main className="flex-grow">
        <motion.section
          className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50 py-24 md:py-32 px-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer()}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-40 right-1/4 w-40 h-40 bg-cyan-200 rounded-full opacity-10 blur-3xl"></div>

          <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div variants={fadeIn()}>
              <Badge
                variant="outline"
                className="mb-3 px-3 py-1 border-teal-300 text-teal-700 bg-teal-50"
              >
                BRIDGE THE COMMUNICATION GAP
              </Badge>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-5 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                  Connect. Collaborate.
                </span>{" "}
                <br />
                Deliver Excellence.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                Empower your academic projects with a unified platform that
                eliminates communication bottlenecks between supervisors and
                teams. From task allocation to progress tracking—everything in
                one place.
              </p>
              <motion.div
                variants={fadeIn(0.2)}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  onClick={goToUserLogin}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-base py-6"
                >
                  Access Your Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={goToAdminLogin}
                  className="border-teal-300 text-teal-700 hover:bg-teal-100 hover:text-teal-900 shadow-sm hover:shadow-md transition-all duration-300 text-base py-6"
                >
                  Admin Portal
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeIn(0.1)}
              className="flex justify-center md:justify-end mt-8 md:mt-0"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-200/40 to-emerald-200/40 backdrop-blur-sm"></div>

                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>

                <div
                  className="relative rounded-2xl overflow-hidden m-3"
                  style={{
                    boxShadow:
                      "inset 0 0 20px rgba(0,0,0,0.15), inset 0 0 6px rgba(255,255,255,0.5)",
                  }}
                >
                  <div className="aspect-[4/3] relative">
                    <Image
                      src="/hero_team_management.jpg"
                      alt="Team Management Illustration"
                      fill
                      priority
                      className="object-cover"
                      style={{
                        filter: "saturate(1.05)",
                      }}
                    />
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl border border-white/50"></div>

                <div className="absolute -inset-4 bg-gradient-to-r from-teal-300/10 to-emerald-300/10 rounded-[2rem] blur-lg -z-10"></div>

                <div className="absolute -top-6 -left-6 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-teal-100/50 z-20 flex items-center space-x-2">
                  <CheckCircle className="text-teal-500 w-5 h-5" />
                  <span className="text-sm font-medium">Task completed</span>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-teal-100/50 z-20 flex items-center space-x-2">
                  <Calendar className="text-teal-500 w-5 h-5" />
                  <span className="text-sm font-medium">
                    Project on schedule
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="py-16 bg-white px-4 border-t border-b border-gray-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer(0.1)}
        >
          <div className="container mx-auto">
            <motion.div variants={fadeIn()} className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Proven Results for Academic Projects
              </h2>
              <p className="text-gray-600">
                See how our system transforms project outcomes
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer(0.1)}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn(0.1 * index)}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-teal-50 text-teal-600">
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <section className="py-20 bg-gray-50 px-4">
          <div className="container mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer()}
              className="text-center mb-16"
            >
              <motion.span
                variants={fadeIn()}
                className="text-teal-600 font-medium mb-2 block"
              >
                TAILORED FOR EVERY ROLE
              </motion.span>
              <motion.h2
                variants={fadeIn()}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Powerful Tools for Your Entire Team
              </motion.h2>
              <motion.p
                variants={fadeIn(0.1)}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                Whether you're a project manager, team leader, or team member,
                our platform has specialized features to boost your
                productivity.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn()}
              className="max-w-4xl mx-auto"
            >
              <Tabs defaultValue={roleTabs[0].role} className="w-full">
                <TabsList className="grid grid-cols-3 mb-10">
                  {roleTabs.map((tab, index) => (
                    <TabsTrigger
                      key={index}
                      value={tab.role}
                      className="py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700"
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.role}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {roleTabs.map((tab, index) => (
                  <TabsContent
                    key={index}
                    value={tab.role}
                    className="border rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="md:w-1/3 flex justify-center">
                        <div className="relative w-44 h-44 flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full"></div>
                          <tab.icon className="w-20 h-20 text-teal-600 relative z-10" />
                        </div>
                      </div>
                      <div className="md:w-2/3">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          Features for {tab.role}
                        </h3>
                        <ul className="space-y-3">
                          {tab.features.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-white px-4">
          <div className="container mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer()}
              className="text-center mb-16"
            >
              <motion.span
                variants={fadeIn()}
                className="text-teal-600 font-medium mb-2 block"
              >
                COMPREHENSIVE SOLUTION
              </motion.span>
              <motion.h2
                variants={fadeIn()}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Everything You Need, All In One Place
              </motion.h2>
              <motion.p
                variants={fadeIn(0.1)}
                className="text-lg text-gray-600 max-w-3xl mx-auto"
              >
                Our platform provides essential tools to keep your academic
                projects organized and your team perfectly synchronized.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer(0.15)}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn(0.1 * index)}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="h-full border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div
                      className={`h-2 bg-gradient-to-r ${feature.color}`}
                    ></div>
                    <CardHeader className="pt-6">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-gray-800">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-gray-600 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 px-4">
          <div className="container mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer()}
              className="text-center mb-16"
            >
              <motion.span
                variants={fadeIn()}
                className="text-teal-600 font-medium mb-2 block"
              >
                SIMPLE PROCESS
              </motion.span>
              <motion.h2
                variants={fadeIn()}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Get Started in Minutes
              </motion.h2>
              <motion.p
                variants={fadeIn(0.1)}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                Follow these simple steps to boost your team's productivity and
                improve project outcomes.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer(0.2)}
              className="max-w-4xl mx-auto"
            >
              <div className="relative">
                <div className="absolute top-0 bottom-0 left-12 md:left-24 w-0.5 bg-teal-100 hidden md:block"></div>

                {howItWorksSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    variants={fadeIn(0.2 * index)}
                    className="mb-12 last:mb-0 flex flex-col md:flex-row items-start gap-6"
                  >
                    <div className="flex-shrink-0 relative">
                      <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-md border border-teal-100 z-10 relative">
                        <div className="text-xs font-bold text-teal-300 absolute top-3 left-3">
                          {step.number}
                        </div>
                        <step.icon className="w-10 h-10 text-teal-600" />
                      </div>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section
        <section className="py-20 bg-gradient-to-b from-white to-teal-50 px-4">
          <div className="container mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer()}
              className="text-center mb-16"
            >
              <motion.span
                variants={fadeIn()}
                className="text-teal-600 font-medium mb-2 block"
              >
                SUCCESS STORIES
              </motion.span>
              <motion.h2
                variants={fadeIn()}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Trusted by Academic Teams
              </motion.h2>
              <motion.p
                variants={fadeIn(0.1)}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                See how our platform has transformed project management for
                students and supervisors alike.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer(0.2)}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn(0.1 * index)}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full bg-white border-0 shadow-lg p-2">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Quote className="w-10 h-10 text-teal-200 mb-4" />
                      <p className="text-gray-700 mb-6 flex-grow italic">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4 border-2 border-teal-100">
                          <AvatarImage
                            src={testimonial.avatar}
                            alt={testimonial.name}
                          />
                          <AvatarFallback className="bg-teal-100 text-teal-700">
                            {testimonial.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {testimonial.title}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section> */}

        <section className="py-20 bg-white px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer()}
              className="text-center mb-16"
            >
              <motion.span
                variants={fadeIn()}
                className="text-teal-600 font-medium mb-2 block"
              >
                COMMON QUESTIONS
              </motion.span>
              <motion.h2
                variants={fadeIn()}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Frequently Asked Questions
              </motion.h2>
              <motion.p
                variants={fadeIn(0.1)}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                Everything you need to know about our team management system.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeIn()}
            >
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-b border-gray-200 py-2"
                  >
                    <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-teal-600 py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer()}
            className="container mx-auto text-center max-w-4xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full opacity-5"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full opacity-5"></div>

            <motion.div
              variants={fadeIn()}
              className="bg-white/10 p-1 rounded-full inline-flex mb-6"
            >
              <Badge className="bg-white text-teal-600 px-4 py-1 rounded-full text-sm font-medium">
                Ready to Transform Your Project Management?
              </Badge>
            </motion.div>

            <motion.h2
              variants={fadeIn()}
              className="text-3xl md:text-5xl font-bold mb-6 relative z-10"
            >
              Eliminate Communication Bottlenecks Today
            </motion.h2>
            <motion.p
              variants={fadeIn(0.1)}
              className="text-lg text-teal-100 mb-10 max-w-2xl mx-auto"
            >
              Join academic teams who have streamlined their project management
              and improved outcomes with our platform.
            </motion.p>
            <motion.div
              variants={fadeIn(0.2)}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                variant="secondary"
                onClick={goToUserLogin}
                className="bg-white text-teal-700 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all text-base px-8 py-6"
              >
                Get Started Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 shadow-lg hover:shadow-xl transition-all text-base px-8 py-6"
              >
                Schedule a Demo
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                Team Management System
              </h3>
              <p className="text-sm leading-relaxed">
                Bridging the gap between supervisors and teams for better
                project outcomes.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Task Management
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Team Collaboration
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Project Timeline
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:mohsinsarmad.learn@gmail.com"
                    className="text-blue-600 hover:underline"
                  >
                    mohsinsarmad.learn@gmail.com
                  </a>
                </li>
                <li>03*********</li>
                <li>Computer Science Department</li>
                <li>University of Gujrat</li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Team Management System. All rights
              reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-teal-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-teal-400 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-teal-400 transition-colors"
              >
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
