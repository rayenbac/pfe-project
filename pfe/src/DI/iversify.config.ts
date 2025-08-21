import { Container } from "inversify";
import { TYPES } from "./Post/types";
import { UserTYPES } from "./User/UserTypes";
import { CategoryTYPES } from "./Category/CategoryTypes"; 
import { FavoriteTYPES } from "./Favorite/FavoriteTypes"; 
import { PropertyTYPES } from "./Property/PropertyTypes"; 
import { TransactionTYPES } from "./Transaction/TransactionTypes";
import { ReviewTYPES } from "./Review/ReviewTypes"; 
import { PaymentTYPES } from "./Payment/PaymentTypes";
import { NotificationTYPES } from "./Notification/NotificationTypes";
import { ChatTYPES } from "./Chat/ChatTypes";
import { AuthTYPES } from "./Auth/AuthTypes";
import { ReportTYPES } from "./Report/ReportTypes";



import { PostService } from "../Services/post.service";
import { PostController } from "../Controllers/post.controller";
import { UserController } from "../Controllers/user.controller";
import { UserService } from "../Services/user.service";

import { CategoryService } from "../Services/category.service"; // Category service import
import { CategoryController } from "../Controllers/category.controller"; // Category controller import

import { FavoriteService } from "../Services/favorite.service"; // Category service import
import { FavoriteController } from "../Controllers/favorite.controller"; // Category controller import

import { PropertyService } from "../Services/property.service"; 
import { PropertyController } from "../Controllers/property.controller"; 


import { TransactionService } from "../Services/transaction.service"; 
import { TransactionController } from "../Controllers/transaction.controller"; 


import { ReviewService } from "../Services/review.service"; 
import { ReviewController } from "../Controllers/review.controller";


import { PaymentService } from "../Services/payment.service";
import { PaymentController } from "../Controllers/payment.controller";
import { NotificationService } from "../Services/notification.service";
import { NotificationController } from "../Controllers/notification.controller";
import { RealtimeNotificationService } from "../Services/realtime-notification.service";
import { ChatService } from "../Services/chat.service";
import { ChatController } from "../Controllers/chat.controller";
import { AuthService } from "../Services/auth.service";
import { AuthController } from "../Controllers/auth.controller";

import { ReportService } from "../Services/report.service";
import { ReportController } from "../Controllers/report.controller";

import { DashboardService } from "../Services/dashboard.service";
import { DashboardController } from "../Controllers/dashboard.controller";

import { InvoiceService } from "../Services/invoice.service";
import { InvoiceController } from "../Controllers/invoice.controller";

import { UploadService } from "../Services/upload.service";
import { EmailService } from "../Services/email.service";
import { StripeService } from "../Services/stripe.service";
import { StripeController } from "../Controllers/stripe.controller";

// Add to your existing imports
import { KonnectService } from "../Services/konnect.service";
import { KonnectController } from "../Controllers/konnect.controller";

import { AgencyService } from "../Services/agency.service";
import { AgencyController } from "../Controllers/agency.controller";
import { AgencyTYPES } from "./Agency/AgencyTypes";

import "reflect-metadata";

const diContainer = new Container();

// Bind the services and controllers for Post
diContainer.bind<PostService>(TYPES.service).to(PostService);
diContainer.bind<PostController>(TYPES.controller).to(PostController);  

// Bind the services and controllers for User
diContainer.bind<UserService>(UserTYPES.userService).to(UserService);
diContainer.bind<UserController>(UserTYPES.controller).to(UserController);

// Bind the services and controllers for Category
diContainer.bind<CategoryService>(CategoryTYPES.categoryService).to(CategoryService);
diContainer.bind<CategoryController>(CategoryTYPES.controller).to(CategoryController);

diContainer.bind<FavoriteService>(FavoriteTYPES.favoriteService).to(FavoriteService);
diContainer.bind<FavoriteController>(FavoriteTYPES.favoriteController).to(FavoriteController);

diContainer.bind<PropertyService>(PropertyTYPES.propertyService).to(PropertyService);
diContainer.bind<PropertyController>(PropertyTYPES.propertycontroller).to(PropertyController);

diContainer.bind<TransactionService>(TransactionTYPES.transactionService).to(TransactionService);
diContainer.bind<TransactionController>(TransactionTYPES.transactionController).to(TransactionController);


diContainer.bind<ReviewService>(ReviewTYPES.reviewService).to(ReviewService);
diContainer.bind<ReviewController>(ReviewTYPES.reviewController).to(ReviewController);


diContainer.bind<PaymentService>(PaymentTYPES.paymentService).to(PaymentService);
diContainer.bind<PaymentController>(PaymentTYPES.paymentController).to(PaymentController);
diContainer.bind<NotificationService>(NotificationTYPES.notificationService).to(NotificationService);
diContainer.bind<NotificationController>(NotificationTYPES.notificationController).to(NotificationController);
diContainer.bind<RealtimeNotificationService>('RealtimeNotificationService').to(RealtimeNotificationService);
diContainer.bind<ChatService>(ChatTYPES.chatService).to(ChatService);
diContainer.bind<ChatController>(ChatTYPES.chatController).to(ChatController);



diContainer.bind<AuthService>(AuthTYPES.authService).to(AuthService);
diContainer.bind<AuthController>(AuthTYPES.authController).to(AuthController);


diContainer.bind<UploadService>(Symbol.for("UploadService")).to(UploadService);
diContainer.bind<EmailService>(Symbol.for("EmailService")).to(EmailService);
diContainer.bind<StripeService>(Symbol.for("StripeService")).to(StripeService);
diContainer.bind<StripeController>(Symbol.for("StripeController")).to(StripeController);



// Add to your container configuration
diContainer.bind<KonnectService>(Symbol.for("KonnectService")).to(KonnectService);
diContainer.bind<KonnectController>(Symbol.for("KonnectController")).to(KonnectController);

diContainer.bind<AgencyService>(AgencyTYPES.agencyService).to(AgencyService);
diContainer.bind<AgencyController>(AgencyTYPES.agencyController).to(AgencyController);

diContainer.bind<ReportService>(ReportTYPES.reportService).to(ReportService);
diContainer.bind<ReportController>(ReportTYPES.reportController).to(ReportController);

diContainer.bind<DashboardService>('DashboardService').to(DashboardService);
diContainer.bind<DashboardController>('DashboardController').to(DashboardController);

diContainer.bind<InvoiceService>('InvoiceService').to(InvoiceService);
diContainer.bind<InvoiceController>('InvoiceController').to(InvoiceController);

export { diContainer };