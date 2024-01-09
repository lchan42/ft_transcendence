import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class SessionAuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		if (request.isAuthenticated && request.user)
			return true;
		return false;
	}
}
