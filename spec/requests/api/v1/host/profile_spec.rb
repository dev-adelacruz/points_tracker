# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host::Profile" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:password) { "SecurePass123!" }
  let(:host) { create(:user, :host, name: "Ana Reyes", email: "ana@example.com", password: password) }
  let(:emcee) { create(:user, :emcee) }

  describe "#show" do
    path "/api/v1/host/profile" do
      get "returns the host's profile" do
        tags "Host::Profile"
        produces "application/json"

        response(200, "returns profile data") do
          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:name]).to eq("Ana Reyes")
            expect(json_response[:data][:email]).to eq("ana@example.com")
          end
        end

        response(403, "returns forbidden for non-host") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#update" do
    path "/api/v1/host/profile" do
      patch "updates the host's profile" do
        tags "Host::Profile"
        consumes "application/json"
        produces "application/json"
        parameter name: :body, in: :body, schema: {
          type: :object,
          properties: {
            name:             { type: :string },
            email:            { type: :string },
            password:         { type: :string },
            current_password: { type: :string }
          }
        }

        response(200, "updates name without password confirmation") do
          let(:body) { { name: "Ana Cruz" } }

          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:name]).to eq("Ana Cruz")
            expect(host.reload.name).to eq("Ana Cruz")
          end
        end

        response(200, "updates email with correct current password") do
          let(:body) { { email: "new@example.com", current_password: password } }

          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:email]).to eq("new@example.com")
            expect(host.reload.email).to eq("new@example.com")
          end
        end

        response(200, "updates password with correct current password") do
          let(:body) { { password: "NewPass456!", current_password: password } }

          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            expect(host.reload.valid_password?("NewPass456!")).to eq(true)
          end
        end

        response(422, "returns error when current password is wrong for email change") do
          let(:body) { { email: "new@example.com", current_password: "wrong" } }

          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
            expect(json_response[:status][:message]).to include("Current password is incorrect")
          end
        end

        response(403, "returns forbidden for non-host") do
          let(:body) { { name: "New Name" } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
