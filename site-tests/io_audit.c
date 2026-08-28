#define _GNU_SOURCE
#include <dlfcn.h>
#include <errno.h>
#include <fcntl.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <unistd.h>

static void audit(const char *kind, const char *path) {
  const char *log = getenv("DP_AUDIT_LOG");
  if (!log) return;
  int fd = syscall(SYS_openat, AT_FDCWD, log, O_WRONLY | O_CREAT | O_APPEND, 0600);
  if (fd < 0) return;
  char line[4096];
  int n = snprintf(line, sizeof(line), "%s\t%s\n", kind, path ? path : "-");
  syscall(SYS_write, fd, line, n);
  syscall(SYS_close, fd);
}

static int writing(int flags) { return flags & (O_WRONLY | O_RDWR | O_CREAT | O_TRUNC | O_APPEND); }

int open(const char *path, int flags, ...) {
  static int (*real_open)(const char *, int, ...) = NULL;
  if (!real_open) real_open = dlsym(RTLD_NEXT, "open");
  mode_t mode = 0; if (flags & O_CREAT) { va_list ap; va_start(ap, flags); mode = va_arg(ap, int); va_end(ap); }
  audit(writing(flags) ? "WRITE" : "READ", path);
  return (flags & O_CREAT) ? real_open(path, flags, mode) : real_open(path, flags);
}

int open64(const char *path, int flags, ...) {
  static int (*real_open64)(const char *, int, ...) = NULL;
  if (!real_open64) real_open64 = dlsym(RTLD_NEXT, "open64");
  mode_t mode = 0; if (flags & O_CREAT) { va_list ap; va_start(ap, flags); mode = va_arg(ap, int); va_end(ap); }
  audit(writing(flags) ? "WRITE" : "READ", path);
  return (flags & O_CREAT) ? real_open64(path, flags, mode) : real_open64(path, flags);
}

int openat(int dirfd, const char *path, int flags, ...) {
  static int (*real_openat)(int, const char *, int, ...) = NULL;
  if (!real_openat) real_openat = dlsym(RTLD_NEXT, "openat");
  mode_t mode = 0; if (flags & O_CREAT) { va_list ap; va_start(ap, flags); mode = va_arg(ap, int); va_end(ap); }
  audit(writing(flags) ? "WRITE" : "READ", path);
  return (flags & O_CREAT) ? real_openat(dirfd, path, flags, mode) : real_openat(dirfd, path, flags);
}

int mkdir(const char *path, mode_t mode) {
  static int (*real_mkdir)(const char *, mode_t) = NULL;
  if (!real_mkdir) real_mkdir = dlsym(RTLD_NEXT, "mkdir");
  audit("WRITE", path); return real_mkdir(path, mode);
}

int rename(const char *oldpath, const char *newpath) {
  static int (*real_rename)(const char *, const char *) = NULL;
  if (!real_rename) real_rename = dlsym(RTLD_NEXT, "rename");
  audit("WRITE", oldpath); audit("WRITE", newpath); return real_rename(oldpath, newpath);
}

int socket(int domain, int type, int protocol) {
  (void)domain; (void)type; (void)protocol; audit("NETWORK", "socket"); errno = EPERM; return -1;
}

int connect(int fd, const struct sockaddr *addr, socklen_t len) {
  (void)fd; (void)addr; (void)len; audit("NETWORK", "connect"); errno = EPERM; return -1;
}

int execve(const char *path, char *const argv[], char *const envp[]) {
  static int (*real_execve)(const char *, char *const[], char *const[]) = NULL;
  if (!real_execve) real_execve = dlsym(RTLD_NEXT, "execve");
  audit("EXEC", path); return real_execve(path, argv, envp);
}

ssize_t write(int fd, const void *buf, size_t count) {
  static ssize_t (*real_write)(int, const void *, size_t) = NULL;
  if (!real_write) real_write = dlsym(RTLD_NEXT, "write");
  const char *needles[] = {"dev@example.com", "sample-token-for-redaction", "10.0.0.1", "/home/dev/workspace"};
  for (size_t i = 0; i < sizeof(needles) / sizeof(needles[0]); i++) if (memmem(buf, count, needles[i], strlen(needles[i]))) audit("RAW_WRITE", needles[i]);
  return real_write(fd, buf, count);
}
