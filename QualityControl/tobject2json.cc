#include <napi.h>
#include <QualityControl/TObject2Json.h>
#include <iostream>
using namespace o2::quality_control::tobject_to_json;

static std::unique_ptr<Backend> BackendInstance;

class TObjectAsyncWorker : public Napi::AsyncWorker
{
public:
  TObjectAsyncWorker(const Napi::Function& callback, const std::string& arg0)
  : Napi::AsyncWorker(callback), path(arg0), output()
  {
  }

protected:
  void Execute() override
  {
    const auto slashIndex = path.find_first_of('/');
    output = BackendInstance->getJsonObject(path.substr(0, slashIndex), path.substr(slashIndex + 1));
  }

  void OnOK() override
  {
    Napi::Env env = Env();

    Callback().MakeCallback(
      Receiver().Value(),
      {
        env.Null(),
        Napi::String::New(env, output)
      }
    );
  }

  void OnError(const Napi::Error& e) override
  {
    Napi::Env env = Env();

    Callback().MakeCallback(
      Receiver().Value(),
      {
        e.Value(),
        env.Undefined()
      }
    );
  }

private:
  std::string path;
  std::string output;
};


/// Create backend instance
void InitBackend(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if ((info.Length() < 1) && (!info[0].IsString())) {
    Napi::TypeError::New(env, "Invalid argument").ThrowAsJavaScriptException();
  }

  if (!BackendInstance) {
    std::string url = info[0].As<Napi::String>();
    BackendInstance = TObject2Json::Get(url);
  }
}

/// Get JSON-encoded TObject asynchronously
void GetObject(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Invalid argument count").ThrowAsJavaScriptException();
    return;
  }

  if (!info[1].IsFunction()) {
    Napi::TypeError::New(env, "Invalid argument types").ThrowAsJavaScriptException();
    return;
  }

  Napi::Function cb = info[1].As<Napi::Function>();

  std::string arg0 = info[0].As<Napi::String>();

  (new TObjectAsyncWorker(cb, arg0))->Queue();

  return;
}

/// Define methods
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(
    Napi::String::New(env, "get"),
    Napi::Function::New(env, GetObject)
  );
  exports.Set(
    Napi::String::New(env, "init"),
    Napi::Function::New(env, InitBackend)
  );
  return exports;
}


NODE_API_MODULE(tobject2json, Init)
